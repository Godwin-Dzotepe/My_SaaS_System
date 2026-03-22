import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

function getDayRange(dateStr: string) {
  const date = new Date(dateStr);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

export const GET = withAuth(
  async ({ req, session }) => {
    try {
      const { searchParams } = new URL(req.url);
      const dateStr = searchParams.get('date');

      if (!session.user.school_id) {
        return NextResponse.json({ error: 'No school ID' }, { status: 400 });
      }

      if (!dateStr) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }

      const { startOfDay, endOfDay } = getDayRange(dateStr);

      const [teachers, records] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: 'teacher',
            school_id: session.user.school_id,
          },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
          orderBy: {
            name: 'asc',
          },
        }),
        prisma.teacherAttendance.findMany({
          where: {
            school_id: session.user.school_id,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            id: true,
            teacher_id: true,
            status: true,
            date: true,
          },
        }),
      ]);

      const attendanceByTeacher = new Map(records.map((record) => [record.teacher_id, record]));

      const preview = teachers.map((teacher) => {
        const record = attendanceByTeacher.get(teacher.id);
        return {
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          phone: teacher.phone,
          email: teacher.email,
          status: record?.status === 'present' ? 'Present' : 'Absent',
          hasMarkedSelf: Boolean(record),
          record_id: record?.id || null,
          recorded_at: record?.date || null,
        };
      });

      return NextResponse.json({
        date: dateStr,
        preview,
        summary: {
          total_teachers: preview.length,
          present: preview.filter((row) => row.status === 'Present').length,
          absent: preview.filter((row) => row.status === 'Absent').length,
        },
      });
    } catch (error) {
      console.error('Error generating teacher attendance preview:', error);
      return NextResponse.json({ error: 'Failed to generate teacher attendance preview.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin', 'secretary'],
  }
);

export const POST = withAuth(
  async ({ req, session }) => {
    try {
      const { date } = await req.json();

      if (!session.user.school_id) {
        return NextResponse.json({ error: 'No school ID' }, { status: 400 });
      }

      if (!date) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
      }

      const { startOfDay, endOfDay } = getDayRange(date);

      const [teachers, existingRecords] = await Promise.all([
        prisma.user.findMany({
          where: {
            role: 'teacher',
            school_id: session.user.school_id,
          },
          select: {
            id: true,
          },
        }),
        prisma.teacherAttendance.findMany({
          where: {
            school_id: session.user.school_id,
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          select: {
            teacher_id: true,
            status: true,
          },
        }),
      ]);

      const existingMap = new Map(existingRecords.map((record) => [record.teacher_id, record.status]));

      await prisma.$transaction(
        teachers.map((teacher) =>
          prisma.teacherAttendance.upsert({
            where: {
              teacher_id_date: {
                teacher_id: teacher.id,
                date: startOfDay,
              },
            },
            update: {
              status: existingMap.get(teacher.id) || 'absent',
            },
            create: {
              teacher_id: teacher.id,
              school_id: session.user.school_id!,
              date: startOfDay,
              status: existingMap.get(teacher.id) || 'absent',
            },
          })
        )
      );

      return NextResponse.json({ success: true, message: 'Teacher attendance finalized successfully.' });
    } catch (error) {
      console.error('Error finalizing teacher attendance:', error);
      return NextResponse.json({ error: 'Failed to finalize teacher attendance.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin', 'secretary'],
  }
);
