interface TelegramSendResult {
  success: boolean;
  error?: string;
}

type TelegramParseMode = 'Markdown' | 'HTML' | 'MarkdownV2';

type TelegramSendOptions = {
  chatId?: string;
  parseMode?: TelegramParseMode | null;
};

function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const defaultChatId = process.env.TELEGRAM_CHAT_ID?.trim();

  return {
    botToken,
    defaultChatId,
  };
}

export function getTelegramConfigStatus() {
  const { botToken, defaultChatId } = getTelegramConfig();

  return {
    configured: Boolean(botToken && defaultChatId),
    hasToken: Boolean(botToken),
    hasChatId: Boolean(defaultChatId),
  };
}

export async function sendTelegramMessage(
  message: string,
  chatIdOrOptions?: string | TelegramSendOptions
): Promise<TelegramSendResult> {
  const { botToken, defaultChatId } = getTelegramConfig();
  const options: TelegramSendOptions =
    typeof chatIdOrOptions === 'string' ? { chatId: chatIdOrOptions } : chatIdOrOptions || {};

  const targetChatId = (options.chatId || defaultChatId || '').trim();
  const parseMode = options.parseMode === undefined ? 'Markdown' : options.parseMode;

  if (!botToken) {
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN is missing in environment.',
    };
  }

  if (!targetChatId) {
    return {
      success: false,
      error: 'TELEGRAM_CHAT_ID is missing in environment.',
    };
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: targetChatId,
      text: message,
      disable_web_page_preview: true,
    };

    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      return {
        success: false,
        error: data?.description || `Telegram request failed with status ${response.status}.`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Telegram message.',
    };
  }
}
