import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { mergeAcademicPeriods } from '@/lib/academic-periods';

export const GET = withAuth(
  async ({ session }) => {
    try {
      const schoolId = session.user.school_id;
      if (!schoolId) {
        return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
      }

      const academicPeriodModel = (prisma as any).academicPeriod;

      const [configuredPeriods, scorePeriods, feePeriods] = await Promise.all([
        academicPeriodModel
          ? academicPeriodModel.findMany({
              where: {
                school_id: schoolId,
                is_active: true,
              },
              select: {
                academic_year: true,
                term: true,
              },
            })
          : Promise.resolve([]),
        prisma.score.findMany({
          where: {
            student: {
              school_id: schoolId,
            },
          },
          select: {
            academic_year: true,
            term: true,
            updated_at: true,
          },
        }),
        prisma.schoolFee.findMany({
          where: {
            school_id: schoolId,
          },
          select: {
            academic_year: true,
            term: true,
            updated_at: true,
          },
        }),
      ]);

      const periods = mergeAcademicPeriods(
        configuredPeriods,
        [...scorePeriods, ...feePeriods].filter(
          (period): period is { academic_year: string; term: string; updated_at: Date } =>
            Boolean(period.academic_year && period.term)
        )
      );

      return NextResponse.json({
        periods,
      });
    } catch (error) {
      console.error('Error fetching teacher periods:', error);
      return NextResponse.json({ error: 'Failed to fetch periods.' }, { status: 500 });
    }
  },
  {
    roles: ['teacher'],
  }
);
