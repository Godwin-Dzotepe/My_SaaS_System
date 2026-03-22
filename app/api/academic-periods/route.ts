import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { mergeAcademicPeriods } from '@/lib/academic-periods';

const academicPeriodSchema = z.object({
  academic_year: z.string().min(1, 'Academic year is required.'),
  term: z.string().min(1, 'Term is required.'),
  is_active: z.boolean().optional(),
});

export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
      }

      const academicPeriodModel = (prisma as any).academicPeriod;

      const [configuredPeriods, scorePeriods, feePeriods] = await Promise.all([
        academicPeriodModel
          ? academicPeriodModel.findMany({
              where: {
                school_id: session.user.school_id,
                is_active: true,
              },
              select: {
                id: true,
                academic_year: true,
                term: true,
                is_active: true,
                created_at: true,
                updated_at: true,
              },
            })
          : Promise.resolve([]),
        prisma.score.findMany({
          where: {
            student: {
              school_id: session.user.school_id,
            },
          },
          select: {
            academic_year: true,
            term: true,
          },
          distinct: ['academic_year', 'term'],
        }),
        prisma.schoolFee.findMany({
          where: {
            school_id: session.user.school_id,
          },
          select: {
            academic_year: true,
            term: true,
          },
          distinct: ['academic_year', 'term'],
        }),
      ]);

      const derivedPeriods = [...scorePeriods, ...feePeriods]
        .filter((period): period is { academic_year: string; term: string } => Boolean(period.academic_year && period.term));

      const periods = mergeAcademicPeriods(
        configuredPeriods.map((period) => ({
          academic_year: period.academic_year,
          term: period.term,
        })),
        derivedPeriods
      );

      return NextResponse.json({
        periods,
        configuredPeriods,
      });
    } catch (error) {
      console.error('Error fetching academic periods:', error);
      return NextResponse.json({ error: 'Failed to fetch academic periods.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin', 'finance_admin', 'teacher', 'parent', 'super_admin'],
  }
);

export const POST = withAuth(
  async ({ req, session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json({ error: 'User is not associated with a school.' }, { status: 400 });
      }

      const body = await req.json();
      const validation = academicPeriodSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input.', details: validation.error.format() }, { status: 400 });
      }

      const academicPeriodModel = (prisma as any).academicPeriod;

      if (!academicPeriodModel) {
        return NextResponse.json(
          { error: 'Academic periods are not ready yet. Please restart the dev server once and try again.' },
          { status: 503 }
        );
      }

      const period = await academicPeriodModel.create({
        data: {
          school_id: session.user.school_id,
          academic_year: validation.data.academic_year.trim(),
          term: validation.data.term.trim(),
          is_active: validation.data.is_active ?? true,
        },
      });

      return NextResponse.json(period, { status: 201 });
    } catch (error: any) {
      console.error('Error creating academic period:', error);

      if (error?.code === 'P2002') {
        return NextResponse.json({ error: 'This academic year and term already exist.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to create academic period.' }, { status: 500 });
    }
  },
  {
    roles: ['school_admin'],
  }
);
