import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { z } from 'zod';
import { hasPublishedResult, RESULT_PUBLISHED_NOTIFICATION } from '@/lib/result-publishing';

const querySchema = z.object({
    academic_year: z.string().min(1, 'Academic year is required'),
    term: z.string().min(1, 'Term is required'),
});

// GET /api/parent/children/[childId]/scores - Fetches scores for a specific child
export const GET = withAuth(
  async ({ session, params, req }) => {
    const childId = params?.childId;
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is missing.' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const useLatest = searchParams.get('latest') === 'true';

    let academic_year: string;
    let term: string;

    if (useLatest) {
      // Resolve to the active academic period for the child's school
      try {
        const child = await prisma.student.findFirst({
          where: { id: childId, deleted_at: null },
          select: { school_id: true },
        });

        if (!child) {
          return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
        }

        const activePeriod = await prisma.academicPeriod.findFirst({
          where:   { school_id: child.school_id, is_active: true },
          orderBy: { created_at: 'desc' },
          select:  { academic_year: true, term: true },
        });

        if (!activePeriod) {
          return NextResponse.json({ error: 'No active academic period found for this school.' }, { status: 404 });
        }

        academic_year = activePeriod.academic_year;
        term          = activePeriod.term;
      } catch (error) {
        console.error(`Error resolving latest academic period for child ${childId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch scores.' }, { status: 500 });
      }
    } else {
      const validation = querySchema.safeParse({
        academic_year: searchParams.get('academic_year'),
        term:          searchParams.get('term'),
      });

      if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
      }

      academic_year = validation.data.academic_year;
      term          = validation.data.term;
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

      // Security Check: Verify the child belongs to the authenticated parent
      const child = await prisma.student.findFirst({
        where: {
          id: childId,
          OR: parentAccessFilters,
          deleted_at: null,
        },
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found or you do not have permission to view their scores.' }, { status: 404 });
      }

      const releaseNotifications = await prisma.appNotification.findMany({
        where: {
          user_id: session.user.id,
          title: RESULT_PUBLISHED_NOTIFICATION,
        },
        select: {
          title: true,
          body: true,
        },
      });

      if (!hasPublishedResult(releaseNotifications, childId, academic_year, term)) {
        return NextResponse.json({ error: 'Results for this period are not published yet.' }, { status: 403 });
      }

      // Fetch scores for the validated child
      const scores = await prisma.score.findMany({
        where: {
          student_id: childId,
          academic_year,
          term,
        },
        include: {
          subject: {
            select: {
              subject_name: true,
            },
          },
        },
        orderBy: {
            subject: {
                subject_name: 'asc'
            }
        }
      });

      if (scores.length === 0) {
          return NextResponse.json({ scores: [], academic_year, term });
      }

      return NextResponse.json({ scores, academic_year, term });

    } catch (error) {
      console.error(`Error fetching scores for child ${childId}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch scores.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['parent'],
  }
);
