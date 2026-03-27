import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { calculateAmountLeft, ensureStudentFeeBalancesForSchool, getStudentFeeBalanceModel } from '@/lib/fee-balances';
import { formatGhanaCedis } from '@/lib/currency';
import { hasPublishedResult, parseResultPublishPayload, RESULT_PUBLISHED_NOTIFICATION } from '@/lib/result-publishing';

function toPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getTermRank(term: string) {
  const ranks: Record<string, number> = {
    'Term 1': 1,
    'Term 2': 2,
    'Term 3': 3,
  };

  return ranks[term] ?? 0;
}

function getRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
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
          student_number: true,
          school_id: true,
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
        },
        orderBy: {
          name: 'asc',
        },
      });

      const childIds = children.map((child) => child.id);

      const schoolIds = Array.from(new Set(children.map((child) => child.school_id).filter(Boolean)));
      await Promise.all(schoolIds.map((schoolId) => ensureStudentFeeBalancesForSchool(schoolId)));

      const studentFeeBalanceModel = getStudentFeeBalanceModel();

      const [attendanceRows, scoreRows, feeBalances, announcements, events, releaseNotifications] = await Promise.all([
        childIds.length > 0
          ? prisma.attendance.findMany({
              where: {
                student_id: { in: childIds },
              },
              select: {
                student_id: true,
                status: true,
                date: true,
              },
            })
          : Promise.resolve([]),
        childIds.length > 0
          ? prisma.score.findMany({
              where: {
                student_id: { in: childIds },
              },
              select: {
                id: true,
                student_id: true,
                grade: true,
                totalScore: true,
                behavior: true,
                teacherAdvice: true,
                academic_year: true,
                term: true,
                updated_at: true,
              },
              orderBy: [
                { academic_year: 'desc' },
                { updated_at: 'desc' },
              ],
            })
          : Promise.resolve([]),
        childIds.length > 0
          ? studentFeeBalanceModel
            ? studentFeeBalanceModel.findMany({
                where: {
                  student_id: { in: childIds },
                },
                include: {
                  schoolFee: {
                    select: {
                      amount: true,
                    },
                  },
                },
              })
            : Promise.resolve([])
          : Promise.resolve([]),
        session.user.school_id
          ? prisma.announcement.findMany({
              where: {
                school_id: session.user.school_id,
              },
              select: {
                id: true,
                message: true,
                created_at: true,
              },
              orderBy: {
                created_at: 'desc',
              },
              take: 5,
            })
          : Promise.resolve([]),
        session.user.school_id
          ? prisma.event.findMany({
              where: {
                school_id: session.user.school_id,
                end_date: {
                  gte: new Date(),
                },
              },
              select: {
                id: true,
                title: true,
                description: true,
                start_date: true,
              },
              orderBy: {
                start_date: 'asc',
              },
              take: 5,
            })
          : Promise.resolve([]),
        prisma.appNotification.findMany({
          where: {
            user_id: session.user.id,
            title: RESULT_PUBLISHED_NOTIFICATION,
          },
          select: {
            title: true,
            body: true,
          },
        }),
      ]);

      const attendanceByChild = new Map<string, { total: number; present: number }>();
      for (const row of attendanceRows) {
        const current = attendanceByChild.get(row.student_id) ?? { total: 0, present: 0 };
        current.total += 1;
        if (row.status === 'present') current.present += 1;
        attendanceByChild.set(row.student_id, current);
      }

      const latestScoreByChild = new Map<string, { grade: string | null; totalScore: number | null; academic_year: string; term: string; updated_at: Date }>();
      const latestAttitudeByChild = new Map<string, { behavior: string | null; teacherAdvice: string | null; academic_year: string; term: string; updated_at: Date }>();
      for (const row of scoreRows) {
        if (!hasPublishedResult(releaseNotifications, row.student_id, row.academic_year, row.term)) {
          continue;
        }

        const existing = latestScoreByChild.get(row.student_id);
        if (!existing) {
          latestScoreByChild.set(row.student_id, row);
          continue;
        }

        const existingRank = getTermRank(existing.term);
        const nextRank = getTermRank(row.term);
        const shouldReplace =
          row.academic_year > existing.academic_year ||
          (row.academic_year === existing.academic_year && nextRank > existingRank) ||
          (row.academic_year === existing.academic_year && nextRank === existingRank && row.updated_at > existing.updated_at);

        if (shouldReplace) {
          latestScoreByChild.set(row.student_id, row);
        }

        if (row.behavior || row.teacherAdvice) {
          const existingAttitude = latestAttitudeByChild.get(row.student_id);
          if (!existingAttitude) {
            latestAttitudeByChild.set(row.student_id, row);
          } else {
            const existingAttitudeRank = getTermRank(existingAttitude.term);
            const nextAttitudeRank = getTermRank(row.term);
            const shouldReplaceAttitude =
              row.academic_year > existingAttitude.academic_year ||
              (row.academic_year === existingAttitude.academic_year && nextAttitudeRank > existingAttitudeRank) ||
              (row.academic_year === existingAttitude.academic_year &&
                nextAttitudeRank === existingAttitudeRank &&
                row.updated_at > existingAttitude.updated_at);

            if (shouldReplaceAttitude) {
              latestAttitudeByChild.set(row.student_id, row);
            }
          }
        }
      }

      const pendingFeesByChild = new Map<string, number>();
      for (const balance of feeBalances) {
        const amountLeft = calculateAmountLeft(balance.schoolFee.amount, balance.amount_paid);
        pendingFeesByChild.set(balance.student_id, (pendingFeesByChild.get(balance.student_id) ?? 0) + amountLeft);
      }

      const childCards = children.map((child) => {
        const attendance = attendanceByChild.get(child.id);
        const attendanceValue = attendance && attendance.total > 0
          ? (attendance.present / attendance.total) * 100
          : null;
        const latestScore = latestScoreByChild.get(child.id);
        const latestAttitude = latestAttitudeByChild.get(child.id);
        const pendingFees = pendingFeesByChild.get(child.id) ?? 0;

        return {
          id: child.id,
          name: child.name,
          school: child.school?.school_name ?? 'School not assigned',
          class: child.class?.class_name ?? 'Class not assigned',
          rollNumber: child.student_number ?? 'No student number',
          avatar: child.name.slice(0, 2).toUpperCase(),
          attendance: attendanceValue !== null ? toPercent(attendanceValue) : 'N/A',
          lastResult: latestScore?.grade || (latestScore?.totalScore !== null && latestScore?.totalScore !== undefined ? String(latestScore.totalScore) : 'N/A'),
          attitude: latestAttitude?.behavior || 'No attitude update yet.',
          teacherAdvice: latestAttitude?.teacherAdvice || 'No teacher advice yet.',
          pendingFees,
          latestPeriod: latestScore ? `${latestScore.term} ${latestScore.academic_year}` : null,
        };
      });

      const avgAttendanceNumeric = childCards
        .map((child) => child.attendance)
        .filter((value): value is string => value !== 'N/A')
        .map((value) => Number.parseFloat(value.replace('%', '')));
      const averageAttendance = avgAttendanceNumeric.length > 0
        ? toPercent(avgAttendanceNumeric.reduce((sum, value) => sum + value, 0) / avgAttendanceNumeric.length)
        : 'N/A';

      const totalPendingFees = childCards.reduce((sum, child) => sum + child.pendingFees, 0);

      const notifications = [
        ...announcements.map((announcement) => ({
          id: `announcement-${announcement.id}`,
          title: 'School Update',
          message: announcement.message,
          time: getRelativeTime(announcement.created_at),
          type: 'info' as const,
          sortDate: announcement.created_at,
        })),
        ...events.map((event) => ({
          id: `event-${event.id}`,
          title: event.title,
          message: event.description || `Upcoming event on ${event.start_date.toLocaleDateString()}`,
          time: `Starts ${event.start_date.toLocaleDateString()}`,
          type: 'success' as const,
          sortDate: event.start_date,
        })),
        ...releaseNotifications
          .map((notification) => parseResultPublishPayload(notification.body))
          .filter((payload): payload is NonNullable<ReturnType<typeof parseResultPublishPayload>> => Boolean(payload))
          .map((payload) => ({
            id: `result-${payload.studentId}-${payload.academicYear}-${payload.term}`,
            title: 'Results Published',
            message: payload.message,
            time: 'Just released',
            type: 'success' as const,
            sortDate: new Date(),
          })),
        ...(totalPendingFees > 0
          ? [
              {
                id: 'pending-fees',
                title: 'Outstanding Fees',
                message: `You have ${formatGhanaCedis(totalPendingFees)} in unpaid school fees.`,
                time: 'Action needed',
                type: 'warning' as const,
                sortDate: new Date(),
              },
            ]
          : []),
      ]
        .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
        .slice(0, 5)
        .map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          time: notification.time,
          type: notification.type,
        }));

      return NextResponse.json({
        stats: {
          totalChildren: childCards.length,
          averageAttendance,
          totalPendingFees,
          notificationsCount: notifications.length,
        },
        children: childCards,
        notifications,
      });
    } catch (error) {
      console.error('Error fetching parent dashboard:', error);
      return NextResponse.json({ error: 'Failed to fetch dashboard data.' }, { status: 500 });
    }
  },
  {
    roles: ['parent'],
  }
);
