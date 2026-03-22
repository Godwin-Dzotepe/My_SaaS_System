import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const bulkAttendanceSchema = z.object({
  class_id: z.string().uuid(),
  date: z.string(),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent']),
  }))
});

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'teacher']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id');
    const dateStr = searchParams.get('date');

    if (!classId || !dateStr) {
      return NextResponse.json({ error: 'Missing class_id or date' }, { status: 400 });
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const schoolClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!schoolClass || !validateSchool(user, schoolClass.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (user.role === 'teacher' && schoolClass.teacher_id !== user.id) {
      return NextResponse.json({ error: 'You are not the teacher of this class' }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: { class_id: classId, status: 'active' },
      select: { id: true, name: true }
    });

    const attendance = await prisma.attendance.findMany({
      where: {
        class_id: classId,
        student_id: { in: students.map((student) => student.id) },
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const data = students.map((student) => {
      const record = attendance.find((entry) => entry.student_id === student.id);
      return {
        student_id: student.id,
        name: student.name,
        status: record ? record.status : null,
        attendance_id: record ? record.id : null
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'secretary', 'teacher']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = bulkAttendanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { class_id, date: dateStr, records } = validation.data;
    if (records.length === 0) {
      return NextResponse.json({ error: 'No attendance records provided' }, { status: 400 });
    }

    const uniqueStudentIds = [...new Set(records.map((record) => record.student_id))];
    if (uniqueStudentIds.length !== records.length) {
      return NextResponse.json({ error: 'Duplicate students found in attendance payload' }, { status: 400 });
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

    const schoolClass = await prisma.class.findUnique({ where: { id: class_id } });
    if (!schoolClass || !validateSchool(user, schoolClass.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (user.role === 'teacher' && schoolClass.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const validStudents = await prisma.student.findMany({
      where: {
        id: { in: uniqueStudentIds },
        class_id,
        school_id: schoolClass.school_id,
        status: 'active',
      },
      select: { id: true },
    });

    if (validStudents.length !== uniqueStudentIds.length) {
      return NextResponse.json({ error: 'One or more students do not belong to this class' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({
        where: {
          class_id,
          student_id: { in: uniqueStudentIds },
          date: { gte: startOfDay, lte: endOfDay },
        }
      });

      await tx.attendance.createMany({
        data: records.map((record) => ({
          student_id: record.student_id,
          class_id,
          status: record.status,
          date: new Date(dateStr)
        }))
      });
    });

    return NextResponse.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
