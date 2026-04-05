import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

const scoreModelHasField = (fieldName: string) => {
  try {
    const scoreModel = (prisma as any)?._runtimeDataModel?.models?.Score;
    if (!scoreModel) return false;

    const fields = scoreModel.fields;
    if (Array.isArray(fields)) {
      return fields.some((field: any) => field?.name === fieldName);
    }

    if (fields && typeof fields === 'object') {
      return fieldName in fields;
    }

    return false;
  } catch {
    return false;
  }
};

export const PUT = withAuth(
  async ({ req, session }) => {
    const supportsBehaviorFields =
      scoreModelHasField('behavior') && scoreModelHasField('teacherAdvice');

    if (!supportsBehaviorFields) {
      return NextResponse.json(
        { error: 'Score behavior/advice fields are not available in the current database schema.' },
        { status: 400 }
      );
    }

    try {
      const body = await req.json();
      const scoreId = typeof body?.scoreId === 'string' ? body.scoreId : '';
      const behavior =
        typeof body?.behavior === 'string' && body.behavior.trim() !== '' ? body.behavior.trim() : null;
      const teacherAdvice =
        typeof body?.teacherAdvice === 'string' && body.teacherAdvice.trim() !== ''
          ? body.teacherAdvice.trim()
          : null;

      if (!scoreId) {
        return NextResponse.json({ error: 'scoreId is required.' }, { status: 400 });
      }

      const score = await prisma.score.findUnique({
        where: { id: scoreId },
        select: {
          id: true,
          student: {
            select: {
              school_id: true,
              class: {
                select: {
                  teacher_id: true,
                },
              },
            },
          },
          subject: {
            select: {
              teachers: {
                where: { id: session.user.id },
                select: { id: true },
              },
            },
          },
        },
      });

      if (!score) {
        return NextResponse.json({ error: 'Score record not found.' }, { status: 404 });
      }

      if (!session.user.school_id || score.student.school_id !== session.user.school_id) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }

      const isAssignedTeacher =
        score.student.class?.teacher_id === session.user.id || score.subject.teachers.length > 0;

      if (!isAssignedTeacher) {
        return NextResponse.json(
          { error: 'You are not assigned to update this score review.' },
          { status: 403 }
        );
      }

      const updated = await prisma.score.update({
        where: { id: scoreId },
        data: {
          behavior,
          teacherAdvice,
        },
        select: {
          id: true,
          behavior: true,
          teacherAdvice: true,
          updated_at: true,
        },
      });

      return NextResponse.json({
        success: true,
        score: updated,
      });
    } catch (error: any) {
      console.error('Error saving score review:', error);
      return NextResponse.json(
        {
          error: 'Failed to save score review.',
          details: error?.message || 'Unknown server error.',
        },
        { status: 500 }
      );
    }
  },
  { roles: ['teacher'] }
);
