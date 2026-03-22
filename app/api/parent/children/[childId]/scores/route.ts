import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { z } from 'zod';

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
    const validation = querySchema.safeParse({
        academic_year: searchParams.get('academic_year'),
        term: searchParams.get('term'),
    });

    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { academic_year, term } = validation.data;

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
        },
      });

      if (!child) {
        return NextResponse.json({ error: 'Child not found or you do not have permission to view their scores.' }, { status: 404 });
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
          return NextResponse.json([]);
      }

      return NextResponse.json(scores);

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
