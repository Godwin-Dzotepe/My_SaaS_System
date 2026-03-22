import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(
  async ({ req, session }) => {
    try {
      const { searchParams } = new URL(req.url);
      const dateFrom = searchParams.get('date_from');
      const dateTo = searchParams.get('date_to');
      const teacherId = searchParams.get('teacher_id');

      const where: any = {};

      if (session.user.role === 'teacher') {
        where.teacher_id = session.user.id;
      } else {
        if (!session.user.school_id) {
          return NextResponse.json({ error: 'No school ID' }, { status: 400 });
        }
        where.school_id = session.user.school_id;
        if (teacherId) {
          where.teacher_id = teacherId;
        }
      }

      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          where.date.gte = from;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          where.date.lte = to;
        }
      }

      const records = await prisma.teacherAttendance.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: [
          { date: 'desc' },
          { teacher: { name: 'asc' } },
        ],
      });

      const total = records.length;
      const present = records.filter((record) => record.status === 'present').length;
      const absent = records.filter((record) => record.status === 'absent').length;

      return NextResponse.json({
        records: records.map((record) => ({
          id: record.id,
          teacher_id: record.teacher_id,
          teacher_name: record.teacher.name,
          teacher_phone: record.teacher.phone,
          teacher_email: record.teacher.email,
          status: record.status === 'present' ? 'Present' : 'Absent',
          date: record.date,
        })),
        summary: {
          total,
          present,
          absent,
        },
      });
    } catch (error) {
      console.error('Error fetching teacher attendance records:', error);
      return NextResponse.json({ error: 'Failed to fetch teacher attendance records.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin', 'secretary', 'teacher'],
  }
);
