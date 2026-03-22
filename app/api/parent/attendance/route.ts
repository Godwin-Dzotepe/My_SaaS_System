import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

function getChildStatus(records: Array<{ status: string; date: Date }>) {
  if (records.length === 0) {
    return 'No records';
  }

  const latestRecord = [...records].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  return latestRecord.status === 'present' ? 'Present' : 'Absent';
}

export const GET = withAuth(
  async ({ session }) => {
    try {
      const parentAccessFilters = [
        { parent_id: session.user.id },
        ...(session.user.phone
          ? [
              { father_phone: session.user.phone },
              { mother_phone: session.user.phone },
              { guardian_phone: session.user.phone },
              { parent_phone: session.user.phone },
            ]
          : []),
      ];

      const children = await prisma.student.findMany({
        where: {
          OR: parentAccessFilters,
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          class: {
            select: {
              class_name: true,
            },
          },
          attendance: {
            select: {
              id: true,
              status: true,
              date: true,
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const childSummaries = children.map((child) => {
        const totalDays = child.attendance.length;
        const presentDays = child.attendance.filter((record) => record.status === 'present').length;
        const absentDays = totalDays - presentDays;
        const attendancePercentage = totalDays > 0
          ? `${((presentDays / totalDays) * 100).toFixed(1)}%`
          : 'N/A';

        return {
          id: child.id,
          name: child.name,
          class_name: child.class?.class_name ?? 'Class not assigned',
          attendancePercentage,
          totalDays,
          presentDays,
          absentDays,
          currentStatus: getChildStatus(child.attendance),
          latestAttendanceDate: child.attendance[0]?.date ?? null,
        };
      });

      const recentAbsences = childSummaries
        .flatMap((child) =>
          children
            .find((entry) => entry.id === child.id)
            ?.attendance
            .filter((record) => record.status === 'absent')
            .map((record) => ({
              childId: child.id,
              childName: child.name,
              date: record.date,
            })) || []
        )
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5)
        .map((absence) => ({
          ...absence,
          date: absence.date.toISOString(),
        }));

      return NextResponse.json({
        children: childSummaries,
        recentAbsences,
      });
    } catch (error) {
      console.error('Error fetching parent attendance summary:', error);
      return NextResponse.json({ error: 'Failed to fetch attendance summary.' }, { status: 500 });
    }
  },
  {
    roles: ['parent'],
  }
);
