import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { answerSchoolAdminQuestion } from '@/lib/ai-automation-service';

export const POST = withAuth(
  async ({ req, session }) => {
    try {
      const schoolId = session.user.school_id;

      if (!schoolId) {
        return NextResponse.json({ error: 'School context not found.' }, { status: 400 });
      }

      const body = await req.json();
      const question = String(body?.question || '').trim();

      if (!question || question.length < 3) {
        return NextResponse.json({ error: 'Question is too short.' }, { status: 400 });
      }

      if (question.length > 1000) {
        return NextResponse.json({ error: 'Question is too long.' }, { status: 400 });
      }

      const result = await answerSchoolAdminQuestion({ schoolId, question });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }

      return NextResponse.json({
        answer: result.answer,
      });
    } catch (error) {
      console.error('[dashboard.ai.ask] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['school_admin'] }
);
