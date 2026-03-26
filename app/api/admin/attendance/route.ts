import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

// Force Next.js not to statically cache this GET route since it relies on authentication
export const dynamic = 'force-dynamic';

export const GET = withAuth(
  async ({ req, session }) => {
    try {
      type ClassSummaryRow = {
        id: string;
        class_name: string;
        teacher: { name: string } | null;
        _count: { students: number };
      };

      type AttendanceSummaryRow = {
        class_id: string;
        status: 'present' | 'absent';
      };

      const url = new URL(req.url);
      const dateParam = url.searchParams.get('date');
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all classes for the school
      const classes: ClassSummaryRow[] = await prisma.class.findMany({
        where: { school_id: session.user.school_id! },
        select: {
          id: true,
          class_name: true,
          teacher: { select: { name: true } },
          _count: { select: { students: { where: { status: 'active' } } } }
        }
      });

      // Get attendance records for the date
      const attendances: AttendanceSummaryRow[] = await prisma.attendance.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          student: { school_id: session.user.school_id! }
        },
        select: {
          class_id: true,
          status: true
        }
      });

      const result = classes.map((c: ClassSummaryRow) => {
        const classAttendances = attendances.filter((a: AttendanceSummaryRow) => a.class_id === c.id);
        const presentCount = classAttendances.filter((a: AttendanceSummaryRow) => a.status === 'present').length;
        const absentCount = classAttendances.filter((a: AttendanceSummaryRow) => a.status === 'absent').length;
        return {
          id: c.id,
          class_name: c.class_name,
          teacher: c.teacher?.name || 'Unassigned',
          total_students: c._count.students,
          present: presentCount,
          absent: absentCount,
          unmarked: c._count.students - (presentCount + absentCount)
        };
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error('Error fetching admin attendance:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { roles: ['school_admin', 'super_admin'] }
);
