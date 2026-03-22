import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

function getTodayRange() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return { now, startOfDay, endOfDay };
}

export const GET = withAuth(
  async ({ session }) => {
    try {
      const { startOfDay, endOfDay } = getTodayRange();

      const todayRecord = await prisma.teacherAttendance.findFirst({
        where: {
          teacher_id: session.user.id,
          school_id: session.user.school_id || undefined,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      const recentRecords = await prisma.teacherAttendance.findMany({
        where: {
          teacher_id: session.user.id,
          school_id: session.user.school_id || undefined,
        },
        orderBy: {
          date: 'desc',
        },
        take: 30,
      });

      return NextResponse.json({
        success: true,
        isMarkedToday: Boolean(todayRecord),
        status: todayRecord?.status || null,
        record: todayRecord,
        records: recentRecords,
      });
    } catch (error) {
      console.error('Attendance fetch error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { roles: ['teacher'] }
);

export const POST = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json({ error: 'Teacher is not associated with a school.' }, { status: 400 });
      }

      const { now, startOfDay } = getTodayRange();

      const record = await prisma.teacherAttendance.upsert({
        where: {
          teacher_id_date: {
            teacher_id: session.user.id,
            date: startOfDay,
          },
        },
        update: {
          status: 'present',
        },
        create: {
          teacher_id: session.user.id,
          school_id: session.user.school_id,
          date: startOfDay,
          status: 'present',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Attendance marked successfully.',
        isMarkedToday: true,
        status: record.status,
        record: {
          ...record,
          marked_at: now.toISOString(),
        },
      });
    } catch (error) {
      console.error('Attendance mark error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { roles: ['teacher'] }
);
