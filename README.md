This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Lead Notifications (SMS Only)

To send registration and demo details directly by SMS from the backend, set these environment variables:

```bash
# Lead notification targets
LEADS_NOTIFICATION_SMS=+233240963964

# SMS provider (MNotify/Nmolify)
SMS_API_KEY=your_sms_api_key
SMS_USERNAME=FutureLink
SMS_DEFAULT_COUNTRY_CODE=233
```

Notes:
- `LEADS_NOTIFICATION_SMS` defaults to `+233240963964` if not set.
- The registration API endpoint is `POST /api/auth/register`.
- The demo booking API endpoint is `POST /api/book-demo`.
- Lead notifications for these two endpoints are SMS-only.

## AI + Telegram Configuration

Add the following keys to your `.env` file:

```bash
AI_API_KEY=your_ai_provider_api_key
AI_MODEL=gemini-2.0-flash
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_REPORT_INTERVAL_HOURS=10
AI_CRON_SECRET=your_random_cron_secret
AI_MAX_RETRIES=2
AI_RETRY_BASE_MS=1200
AI_INTER_REPORT_DELAY_MS=900

TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TELEGRAM_SUPER_ADMIN_CHAT_IDS=comma_separated_chat_ids_optional
TELEGRAM_WEBHOOK_SECRET=your_random_webhook_secret_optional
TELEGRAM_WEBHOOK_BASE_URL=https://your-public-domain-optional
```

Notes:
- `AI_API_KEY` is required to generate AI reports.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are required to send the generated report to Telegram.
- Super admin controls AI per school from the schools management page.
- School admin AI assistant and reports only work when super admin enables AI for that school.
- Super admin can trigger due report generation from the dashboard or via `POST /api/super-admin/ai/report`.
- Super admin can ask AI questions via `POST /api/super-admin/ai/ask` and optionally forward Q&A to Telegram.
- Super admin can also ask AI directly from Telegram via `POST /api/telegram/webhook` once Telegram webhook is configured.
- To auto-configure webhook from your app, call `POST /api/telegram/webhook/register` with header `x-cron-secret: <AI_CRON_SECRET>`.
- To check webhook status from your app, call `GET /api/telegram/webhook/register` with header `x-cron-secret: <AI_CRON_SECRET>`.
- AI assistant appears as a floating icon at the bottom-right for super admin and enabled school-admin dashboards.
- To automate every 10 hours, schedule a cron call to `POST /api/cron/ai/reports` with header `x-cron-secret: <AI_CRON_SECRET>`.
- `AI_MAX_RETRIES` retries transient provider failures (especially HTTP 429/5xx).
- `AI_RETRY_BASE_MS` controls retry backoff timing in milliseconds.
- `AI_INTER_REPORT_DELAY_MS` adds spacing between school report generations to reduce burst rate limits.
- If `TELEGRAM_WEBHOOK_SECRET` is set, Telegram webhook requests must include matching `x-telegram-bot-api-secret-token`.
- `TELEGRAM_WEBHOOK_BASE_URL` can be set when app host auto-detection is not available (for example behind proxies).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
