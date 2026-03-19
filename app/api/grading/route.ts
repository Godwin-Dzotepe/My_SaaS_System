import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const gradingConfigSchema = z.object({
  school_id: z.string().uuid(),
  grade: z.string(),
  min_score: z.number().min(0).max(100),
  max_score: z.number().min(0).max(100),
  remark: z.string(),
});

// GET: Fetch grading config for a school
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin', 'super_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const school_id = searchParams.get('school_id');

    if (!school_id) {
      return NextResponse.json({ error: 'school_id is required' }, { status: 400 });
    }

    // Validate school access
    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const configs = await prisma.gradingConfig.findMany({
      where: { school_id },
      orderBy: { min_score: 'desc' }
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching grading config:', error);
    return NextResponse.json({ error: 'Failed to fetch grading config' }, { status: 500 });
  }
}

// POST: Save grading config (upsert)
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const body = await req.json();
    const validation = gradingConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.format() }, { status: 400 });
    }

    const { school_id, grade, min_score, max_score, remark } = validation.data;

    // Validate school access
    if (!validateSchool(user, school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Upsert: Check if exists, then update or create
    const config = await prisma.gradingConfig.upsert({
      where: {
        school_id_grade: {
          school_id,
          grade
        }
      },
      update: {
        min_score,
        max_score,
        remark
      },
      create: {
        school_id,
        grade,
        min_score,
        max_score,
        remark
      }
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('Error saving grading config:', error);
    return NextResponse.json({ error: 'Failed to save grading config' }, { status: 500 });
  }
}

// DELETE: Remove a grade config
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authorize(req, ['school_admin']);
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const config = await prisma.gradingConfig.findUnique({
      where: { id }
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    if (!validateSchool(user, config.school_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.gradingConfig.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Grade config deleted' });
  } catch (error) {
    console.error('Error deleting grading config:', error);
    return NextResponse.json({ error: 'Failed to delete grading config' }, { status: 500 });
  }
}
