import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['teacher']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const teacher = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      created_at: true,
      classes: {
        select: { id: true, class_name: true },
      },
      subjects: {
        select: { id: true, subject_name: true },
      },
    },
  });

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  return NextResponse.json({
    assignedClass: teacher.classes[0] ?? null,
    subjects: teacher.subjects,
    joinedAt: teacher.created_at,
  });
}
