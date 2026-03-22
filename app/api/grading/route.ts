import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';
import { z } from 'zod';

const gradingConfigSchema = z.object({
  grade: z.string().min(1, 'Grade is required.'),
  min_score: z.number().int().min(0).max(100),
  max_score: z.number().int().min(0).max(100),
  remark: z.string().min(1, 'Remark is required.'),
});

// GET /api/grading - Fetch all grading configs for the admin's school
export const GET = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json(
          { error: 'User is not associated with a school.' },
          { status: 400 }
        );
      }

      const gradingConfigs = await prisma.gradingConfig.findMany({
        where: { school_id: session.user.school_id },
        orderBy: { min_score: 'desc' },
      });

      return NextResponse.json(gradingConfigs);
    } catch (error) {
      console.error('Error fetching grading configs:', error);
      return NextResponse.json(
        { error: 'Something went wrong.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['school_admin'],
  }
);

// POST /api/grading - Create a new grading config for the admin's school
export const POST = withAuth(
  async ({ req, session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json(
          { error: 'User is not associated with a school.' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const validation = gradingConfigSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
      }

      const { grade, min_score, max_score, remark } = validation.data;

      // Check for overlapping ranges
      const overlappingRule = await prisma.gradingConfig.findFirst({
        where: {
            school_id: session.user.school_id,
            OR: [
                { min_score: { lte: max_score }, max_score: { gte: min_score } }
            ]
        }
      });

      if (overlappingRule) {
          return NextResponse.json({ error: `New rule overlaps with existing rule: "${overlappingRule.grade}" (${overlappingRule.min_score}-${overlappingRule.max_score})` }, { status: 409 });
      }

      const newConfig = await prisma.gradingConfig.create({
        data: {
          school_id: session.user.school_id,
          grade,
          min_score,
          max_score,
          remark,
        },
      });

      return NextResponse.json(newConfig, { status: 201 });
    } catch (error) {
      console.error('Error creating grading config:', error);
      return NextResponse.json(
        { error: 'Something went wrong.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['school_admin'],
  }
);

// DELETE /api/grading - Delete all grading configs for the admin's school
export const DELETE = withAuth(
  async ({ session }) => {
    try {
      if (!session.user.school_id) {
        return NextResponse.json(
          { error: 'User is not associated with a school.' },
          { status: 400 }
        );
      }

      await prisma.gradingConfig.deleteMany({
        where: { school_id: session.user.school_id },
      });

      return NextResponse.json({ message: 'Grading configurations deleted successfully.' }, { status: 200 });
    } catch (error) {
      console.error('Error deleting grading configs:', error);
      return NextResponse.json(
        { error: 'Something went wrong.' },
        { status: 500 }
      );
    }
  },
  {
    roles: ['school_admin'],
  }
);
