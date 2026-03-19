import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const scoreSchema = z.object({
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  score: z.number().min(0).max(100),
  term: z.string().min(1),
  academic_year: z.string().min(4),
  // Additional context for validation if needed
  school_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = scoreSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { student_id, subject_id, score, term, academic_year } = validation.data;

    // TODO: Verify teacher has permission to grade this student/subject
    
    // Create or Update score? Assuming new entry for now, but upsert might be better
    // to prevent duplicate entries for same term/subject/student.
    
    // Check if score already exists
    const existingScore = await prisma.score.findFirst({
        where: {
            student_id,
            subject_id,
            term,
            academic_year
        }
    });

    if (existingScore) {
         // Update existing
         const updatedScore = await prisma.score.update({
             where: { id: existingScore.id },
             data: { score }
         });
         return NextResponse.json(updatedScore);
    }

    const newScore = await prisma.score.create({
      data: {
        student_id,
        subject_id,
        score,
        term,
        academic_year
      }
    });

    return NextResponse.json(newScore, { status: 201 });
  } catch (error) {
    console.error('Error recording score:', error);
    return NextResponse.json({ error: 'Failed to record score' }, { status: 500 });
  }
}
