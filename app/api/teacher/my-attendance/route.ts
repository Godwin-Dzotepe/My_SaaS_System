import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

const GHANA_TIMEZONE = 'Africa/Accra';
const MARK_PRESENT_START_MINUTES = 6 * 60; // 6:00 AM
const MARK_PRESENT_END_MINUTES = 8 * 60 + 30; // 8:30 AM

function getGhanaNowParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GHANA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function getTodayRangeInGhana() {
  const now = new Date();
  const ghana = getGhanaNowParts(now);
  const ghanaMinutes = ghana.hour * 60 + ghana.minute;

  const startOfDay = new Date(Date.UTC(ghana.year, ghana.month - 1, ghana.day, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(ghana.year, ghana.month - 1, ghana.day, 23, 59, 59, 999));

  const isWithinMarkWindow =
    ghanaMinutes >= MARK_PRESENT_START_MINUTES && ghanaMinutes <= MARK_PRESENT_END_MINUTES;
  const hasMarkWindowPassed = ghanaMinutes > MARK_PRESENT_END_MINUTES;

  return {
    now,
    startOfDay,
    endOfDay,
    isWithinMarkWindow,
    hasMarkWindowPassed,
    windowLabel: '6:00 AM - 8:30 AM (Ghana time)',
  };
}

export const GET = withAuth(
  async ({ session }) => {
    try {
      const {
        startOfDay,
        endOfDay,
        isWithinMarkWindow,
        hasMarkWindowPassed,
        windowLabel,
      } = getTodayRangeInGhana();

      let todayRecord = await prisma.teacherAttendance.findFirst({
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

      // Auto-mark absent after the mark-present window if no attendance has been recorded today.
      if (!todayRecord && hasMarkWindowPassed && session.user.school_id) {
        todayRecord = await prisma.teacherAttendance.upsert({
          where: {
            teacher_id_date: {
              teacher_id: session.user.id,
              date: startOfDay,
            },
          },
          update: {
            status: 'absent',
          },
          create: {
            teacher_id: session.user.id,
            school_id: session.user.school_id,
            date: startOfDay,
            status: 'absent',
          },
        });
      }

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
        canMarkPresent: !todayRecord && isWithinMarkWindow,
        markWindow: windowLabel,
        autoMarkedAbsent: todayRecord?.status === 'absent' && hasMarkWindowPassed,
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

      const {
        now,
        startOfDay,
        endOfDay,
        isWithinMarkWindow,
        windowLabel,
      } = getTodayRangeInGhana();

      if (!isWithinMarkWindow) {
        return NextResponse.json(
          { error: `You can only mark present between ${windowLabel}.` },
          { status: 403 }
        );
      }

      const existingToday = await prisma.teacherAttendance.findFirst({
        where: {
          teacher_id: session.user.id,
          school_id: session.user.school_id,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (existingToday) {
        return NextResponse.json(
          { error: `Attendance already marked as ${existingToday.status} for today.` },
          { status: 400 }
        );
      }

      const record = await prisma.teacherAttendance.create({
        data: {
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
        canMarkPresent: false,
        markWindow: windowLabel,
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
