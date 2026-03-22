import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize } from '@/lib/api-auth';
import { z } from 'zod';

const homeworkSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().optional(),
  class_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const auth = await authorize(req, ['teacher']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = await req.json();
    const validation = homeworkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.issues }, { status: 400 });
    }

    const homework = await prisma.homework.create({
      data: {
        ...validation.data,
        teacher_id: user.id,
        due_date: validation.data.due_date ? new Date(validation.data.due_date) : null,
      }
    });

    return NextResponse.json(homework, { status: 201 });
  } catch (error) {
    console.error('Error creating homework:', error);
    return NextResponse.json({ error: 'Failed to create homework' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await authorize(req, ['teacher']);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const homeworks = await prisma.homework.findMany({
      where: {
        teacher_id: user.id
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(homeworks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch homeworks' }, { status: 500 });
  }
}
