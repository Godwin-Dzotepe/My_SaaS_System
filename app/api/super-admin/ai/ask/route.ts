import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { answerSuperAdminQuestion } from '@/lib/ai-automation-service';
import { sendTelegramMessage } from '@/lib/telegram-service';

export const POST = withAuth(
  async ({ req }) => {
    try {
      const body = await req.json();
      const question = String(body?.question || '').trim();
      const sendToTelegram = Boolean(body?.sendToTelegram);

      if (!question || question.length < 3) {
        return NextResponse.json({ error: 'Question is too short.' }, { status: 400 });
      }

      if (question.length > 1200) {
        return NextResponse.json({ error: 'Question is too long.' }, { status: 400 });
      }

      const result = await answerSuperAdminQuestion({ question });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }

      let telegramError: string | null = null;
      if (sendToTelegram) {
        const telegramResult = await sendTelegramMessage(
          `*Super Admin AI Q&A*\n\n*Question:* ${question}\n\n*Answer:*\n${result.answer}`
        );

        if (!telegramResult.success) {
          telegramError = telegramResult.error || 'Failed to send to Telegram.';
        }
      }

      return NextResponse.json({
        answer: result.answer,
        telegramError,
      });
    } catch (error) {
      console.error('[super-admin.ai.ask] Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  { roles: ['super_admin'] }
);
