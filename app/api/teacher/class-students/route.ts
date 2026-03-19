import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authorize, validateSchool } from '@/lib/api-auth';

const querySchema = z.object({
  class_id: z.string().uuid(),
  school_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['teacher', 'school_admin', 'super_admin']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const class_id = searchParams.get('class_id');
  const school_id = searchParams.get('school_id');

  const validation = querySchema.safeParse({ class_id, school_id });
  if (!validation.success) {
    return NextResponse.json({ error: 'Missing or invalid class_id/school_id' }, { status: 400 });
  }

  // Multitenancy Check
  if (!validateSchool(user, validation.data.school_id)) {
    return NextResponse.json({ error: 'Unauthorized school access' }, { status: 403 });
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        class_id: validation.data.class_id,
        school_id: validation.data.school_id,
        status: 'active'
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
