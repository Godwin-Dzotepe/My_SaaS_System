import { NextRequest, NextResponse } from 'next/server';
import { runDueAiReports } from '@/lib/ai-automation-service';
import { getAiConfigStatus } from '@/lib/ai-provider';

function isAuthorizedCronRequest(req: NextRequest) {
  const expected = process.env.AI_CRON_SECRET?.trim();
  if (!expected) return false;

  const headerSecret = req.headers.get('x-cron-secret')?.trim();
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret')?.trim();

  return headerSecret === expected || querySecret === expected;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
    }

    const aiStatus = getAiConfigStatus();
    if (!aiStatus.configured) {
      return NextResponse.json({ error: 'AI_API_KEY is missing.' }, { status: 400 });
    }

    const result = await runDueAiReports();
    return NextResponse.json({
      message: 'Scheduled AI report run completed.',
      result,
    });
  } catch (error) {
    console.error('[cron.ai.reports] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
