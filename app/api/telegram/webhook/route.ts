import { NextRequest, NextResponse } from 'next/server';
import { answerSuperAdminQuestion } from '@/lib/ai-automation-service';
import { sendTelegramMessage } from '@/lib/telegram-service';

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { is_bot?: boolean };
  };
  edited_message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { is_bot?: boolean };
  };
};

function isAuthorizedWebhookRequest(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected) return true;
  const provided = req.headers.get('x-telegram-bot-api-secret-token')?.trim();
  return provided === expected;
}

function getAllowedSuperAdminChatIds() {
  const configured = process.env.TELEGRAM_SUPER_ADMIN_CHAT_IDS?.trim();
  const fallback = process.env.TELEGRAM_CHAT_ID?.trim();
  const source = configured || fallback || '';

  return new Set(
    source
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function extractIncomingMessage(update: TelegramUpdate) {
  return update.message || update.edited_message || null;
}

function normalizeQuestion(rawText: string) {
  const text = rawText.trim();
  if (!text) return '';
  if (text.toLowerCase().startsWith('/ai ')) {
    return text.slice(4).trim();
  }
  return text;
}

function splitTelegramText(text: string, maxLength = 3800) {
  if (text.length <= maxLength) return [text];

  const parts: string[] = [];
  let index = 0;
  while (index < text.length) {
    parts.push(text.slice(index, index + maxLength));
    index += maxLength;
  }
  return parts;
}

async function sendLongTelegramReply(chatId: string, text: string) {
  const parts = splitTelegramText(text);
  for (const part of parts) {
    await sendTelegramMessage(part, { chatId, parseMode: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedWebhookRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized Telegram webhook request.' }, { status: 401 });
    }

    const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
    if (!update) {
      return NextResponse.json({ ok: true });
    }

    const incoming = extractIncomingMessage(update);
    if (!incoming?.text) {
      return NextResponse.json({ ok: true });
    }

    if (incoming.from?.is_bot) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(incoming.chat?.id || '').trim();
    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const allowedChatIds = getAllowedSuperAdminChatIds();
    if (!allowedChatIds.has(chatId)) {
      await sendTelegramMessage(
        'This bot accepts AI questions only from authorized super-admin Telegram chat IDs.',
        { chatId, parseMode: null }
      );
      return NextResponse.json({ ok: true });
    }

    const question = normalizeQuestion(incoming.text);
    if (!question || question === '/start' || question === '/help') {
      await sendTelegramMessage(
        'Super Admin AI is active. Send your question directly, or use: /ai <your question>.',
        { chatId, parseMode: null }
      );
      return NextResponse.json({ ok: true });
    }

    if (question.length < 3) {
      await sendTelegramMessage('Question is too short. Please send at least 3 characters.', {
        chatId,
        parseMode: null,
      });
      return NextResponse.json({ ok: true });
    }

    if (question.length > 1200) {
      await sendTelegramMessage('Question is too long. Please keep it under 1200 characters.', {
        chatId,
        parseMode: null,
      });
      return NextResponse.json({ ok: true });
    }

    const result = await answerSuperAdminQuestion({ question });

    if (!result.success || !result.answer) {
      const errorText = result.error || 'AI could not answer your question right now.';
      await sendTelegramMessage(`AI error: ${errorText}`, { chatId, parseMode: null });
      return NextResponse.json({ ok: true });
    }

    const reply = `Super Admin AI\n\nQ: ${question}\n\nA:\n${result.answer}`;
    await sendLongTelegramReply(chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram.webhook] Error:', error);
    return NextResponse.json({ ok: true });
  }
}
