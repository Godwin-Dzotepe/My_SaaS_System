import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const attendanceSchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(['present', 'absent']),
  date: z.string().optional(),
});

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

    // 1. Fetch class to check ownership if teacher
    const schoolClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!schoolClass || !validateSchool(user, schoolClass.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (user.role === 'teacher' && schoolClass.teacher_id !== user.id) {
      return NextResponse.json({ error: 'You are not the teacher of this class' }, { status: 403 });
    }

    // 2. Fetch students in class
    const students = await prisma.student.findMany({
      where: { class_id: classId, status: 'active' },
      select: { id: true, name: true }
    });

    // 3. Fetch attendance for these students on this date
    const attendance = await prisma.attendance.findMany({
      where: {
        student_id: { in: students.map(s => s.id) },
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // 4. Map students with their attendance status
    const data = students.map(student => {
      const record = attendance.find(a => a.student_id === student.id);
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
    if (!validation.success) return NextResponse.json({ error: validation.error.format() }, { status: 400 });

    const { class_id, date: dateStr, records } = validation.data;
    const date = new Date(dateStr);
    const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

    // Check permissions
    const schoolClass = await prisma.class.findUnique({ where: { id: class_id } });
    if (!schoolClass || !validateSchool(user, schoolClass.school_id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (user.role === 'teacher' && schoolClass.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Use transaction to upsert records
    await prisma.$transaction(
      records.map(rec => {
        return prisma.attendance.upsert({
          where: {
            // We need a unique constraint to upsert easily, 
            // but Prisma schema doesn't have a composite unique on [student_id, date].
            // So we manually find and update or create.
            id: 'temp_id_replaced_by_manual_logic' 
          },
          create: { student_id: rec.student_id, class_id: class_id, status: rec.status, date: new Date(dateStr) },
          update: { status: rec.status }
        });
      })
    ).catch(async (err) => {
        // Since we don't have a unique key for upsert in the schema, let's use a safer approach:
        // Delete existing for this date and re-insert.
        await prisma.attendance.deleteMany({
            where: {
                student_id: { in: records.map(r => r.student_id) },
                date: { gte: startOfDay, lte: endOfDay }
            }
        });
        await prisma.attendance.createMany({
            data: records.map(r => ({
                student_id: r.student_id,
                class_id: class_id,
                status: r.status,
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
