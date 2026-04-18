import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { mergeAcademicPeriods } from '@/lib/academic-periods';


export const GET = withAuth(
  async ({ session, params, req }) => {
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
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
      }

      const scorePeriods = await prisma.score.findMany({
        where: { student_id: childId },
        select: { academic_year: true, term: true },
        distinct: ['academic_year', 'term'],
      });

      const availablePeriods = mergeAcademicPeriods(scorePeriods);

      const { searchParams } = new URL(req.url);
      const selectedAcademicYear = searchParams.get('academic_year') || availablePeriods[0]?.academic_year || '';
      const selectedTerm = searchParams.get('term') || availablePeriods[0]?.term || '';

      const scores = selectedAcademicYear && selectedTerm
        ? await prisma.score.findMany({
            where: {
              student_id: childId,
              academic_year: selectedAcademicYear,
              term: selectedTerm,
            },
            select: {
              id: true,
              classScore: true,
              examScore: true,
              totalScore: true,
              behavior: true,
              teacherAdvice: true,
              grade: true,
              remark: true,
              subject: {
                select: {
                  subject_name: true,
                },
              },
            },
            orderBy: {
              subject: {
                subject_name: 'asc',
              },
            },
          })
        : [];

      const numericScores = scores
        .map((score) => score.totalScore)
        .filter((score): score is number => score !== null);
      const averageScore = numericScores.length > 0
        ? Number((numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length).toFixed(1))
        : null;

      return NextResponse.json({
        child,
        availablePeriods: availablePeriods.map((period) => ({
          academic_year: period.academic_year,
          term: period.term,
        })),
        selectedPeriod: {
          academic_year: selectedAcademicYear,
          term: selectedTerm,
        },
        summary: {
          averageScore,
          position: null,
        },
        scores,
      });
    } catch (error) {
      console.error(`Error fetching report for child ${childId}:`, error);
      return NextResponse.json({ error: 'Failed to fetch child report.' }, { status: 500 });
    }
  },
  {
    roles: ['parent'],
  }
);
