import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(
  async ({ session, params }) => {
    const childId = params?.childId;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required.' }, { status: 400 });
    }

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

      const child = await prisma.student.findFirst({
        where: {
          id: childId,
          OR: parentAccessFilters,
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          class: {
            select: {
              class_name: true,
            },
          },
          school: {
            select: {
              school_name: true,
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
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
      }

      const totalDays = child.attendance.length;
      const presentDays = child.attendance.filter((record) => record.status === 'present').length;
      const absentDays = totalDays - presentDays;
      const attendanceRate = totalDays > 0
        ? `${((presentDays / totalDays) * 100).toFixed(1)}%`
        : 'N/A';

      return NextResponse.json({
        child: {
          id: child.id,
          name: child.name,
          class_name: child.class?.class_name ?? 'Class not assigned',
          school_name: child.school?.school_name ?? 'School not assigned',
        },
        summary: {
          totalDays,
          presentDays,
          absentDays,
          attendanceRate,
        },
        records: child.attendance.map((record) => ({
          id: record.id,
          status: record.status,
          date: record.date.toISOString(),
        })),
      });
    } catch (error) {
      console.error(`Error fetching attendance for child ${childId}:`, error);
      return NextResponse.json({ error: 'Failed to fetch child attendance.' }, { status: 500 });
    }
  },
  {
    roles: ['parent'],
  }
);
