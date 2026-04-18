import { NextRequest, NextResponse } from 'next/server';

type TelegramWebhookInfo = {
  ok: boolean;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    ip_address?: string;
  };
  description?: string;
};

type TelegramApiResult = {
  ok: boolean;
  description?: string;
  error_code?: number;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function getConfiguredBaseUrl() {
  const explicitBaseUrl = process.env.TELEGRAM_WEBHOOK_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return trimTrailingSlash(explicitBaseUrl);
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!publicApiUrl) return null;

  try {
    const parsed = new URL(publicApiUrl);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return null;
    }
    return trimTrailingSlash(parsed.origin);
  } catch {
    return null;
  }
}

function getRequestBaseUrl(req: NextRequest) {
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || req.headers.get('host')?.trim();

  if (!host) return null;
  const proto = forwardedProto || req.nextUrl.protocol.replace(':', '') || 'https';
  const baseUrl = `${proto}://${host}`;

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return null;
  }

  return trimTrailingSlash(baseUrl);
}

function resolveWebhookBaseUrl(req: NextRequest) {
  return getConfiguredBaseUrl() || getRequestBaseUrl(req);
}

function isAuthorized(req: NextRequest) {
  const expected = process.env.AI_CRON_SECRET?.trim();
  if (!expected) return true;

  const headerSecret = req.headers.get('x-cron-secret')?.trim();
  const authHeader = req.headers.get('authorization')?.trim() || '';
  const bearerSecret = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  return headerSecret === expected || bearerSecret === expected;
}

function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
}

function getTelegramWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || '';
}

async function fetchTelegramWebhookInfo(token: string): Promise<TelegramWebhookInfo> {
  const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
    method: 'GET',
    cache: 'no-store',
  });

  return (await response.json().catch(() => ({ ok: false }))) as TelegramWebhookInfo;
}

async function setTelegramWebhook(params: {
  token: string;
  webhookUrl: string;
  secretToken?: string;
  dropPendingUpdates?: boolean;
}) {
  const body = new URLSearchParams();
  body.set('url', params.webhookUrl);

  if (params.secretToken) {
    body.set('secret_token', params.secretToken);
  }

  if (params.dropPendingUpdates) {
    body.set('drop_pending_updates', 'true');
  }

  const response = await fetch(`https://api.telegram.org/bot${params.token}/setWebhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  return (await response.json().catch(() => ({ ok: false }))) as TelegramApiResult;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const token = getTelegramBotToken();
  if (!token) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN is not configured.' },
      { status: 400 }
    );
  }

  const baseUrl = resolveWebhookBaseUrl(req);
  const expectedWebhookUrl = baseUrl ? `${baseUrl}/api/telegram/webhook` : null;
  const info = await fetchTelegramWebhookInfo(token);

  return NextResponse.json({
    ok: true,
    expectedWebhookUrl,
    webhook: info.result || null,
    warning: baseUrl
      ? null
      : 'Public base URL could not be resolved. Set TELEGRAM_WEBHOOK_BASE_URL in env for automatic registration.',
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const token = getTelegramBotToken();
  if (!token) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN is not configured.' },
      { status: 400 }
    );
  }

  if (!token.includes(':')) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN format is invalid. Expected <bot_id>:<bot_secret>.' },
      { status: 400 }
    );
  }

  const payload = (await req.json().catch(() => null)) as
    | { baseUrl?: string; dropPendingUpdates?: boolean }
    | null;

  const requestBaseUrl = payload?.baseUrl?.trim();
  const resolvedBaseUrl =
    (requestBaseUrl ? trimTrailingSlash(requestBaseUrl) : null) || resolveWebhookBaseUrl(req);

  if (!resolvedBaseUrl) {
    return NextResponse.json(
      {
        error:
          'Could not resolve a public base URL for webhook registration. Set TELEGRAM_WEBHOOK_BASE_URL in env, or send { "baseUrl": "https://your-domain.com" } in this POST request.',
      },
      { status: 400 }
    );
  }

  const webhookUrl = `${resolvedBaseUrl}/api/telegram/webhook`;
  const webhookSecret = getTelegramWebhookSecret();

  const setResult = await setTelegramWebhook({
    token,
    webhookUrl,
    secretToken: webhookSecret || undefined,
    dropPendingUpdates: Boolean(payload?.dropPendingUpdates),
  });

  if (!setResult.ok) {
    return NextResponse.json(
      {
        error: setResult.description || 'Telegram setWebhook failed.',
        telegram: setResult,
      },
      { status: 502 }
    );
  }

  const info = await fetchTelegramWebhookInfo(token);

  return NextResponse.json({
    ok: true,
    webhookUrl,
    webhookSecretEnabled: Boolean(webhookSecret),
    telegram: setResult,
    webhookInfo: info.result || null,
  });
}
