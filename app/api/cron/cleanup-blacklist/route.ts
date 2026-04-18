import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * DELETE /api/cron/cleanup-blacklist
 * Removes expired token blacklist entries.
 * Should be called periodically (e.g., daily) by a cron service.
 * Protected by CRON_SECRET env var.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret');

  if (secret && provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await prisma.tokenBlacklist.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });

    logger.info('[cron] Cleaned up expired token blacklist entries', { count: result.count });
    return NextResponse.json({ deleted: result.count });
  } catch (err) {
    logger.error('[cron] Blacklist cleanup failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
