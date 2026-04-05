import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    return { ok: false as const, message: 'DATABASE_URL is not set.' };
  }
  return { ok: true as const, value };
}

function getProtocol(databaseUrl: string) {
  try {
    return { ok: true as const, protocol: new URL(databaseUrl).protocol.replace(':', '').toLowerCase() };
  } catch {
    return { ok: false as const, message: 'DATABASE_URL is invalid.' };
  }
}

export async function GET() {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Database is not configured.', details: dbUrl.message },
      { status: 503 }
    );
  }

  const parsed = getProtocol(dbUrl.value);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: 'Database URL format is invalid.', details: parsed.message },
      { status: 503 }
    );
  }

  if (parsed.protocol !== 'mysql' && parsed.protocol !== 'mariadb') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Database protocol is misconfigured.',
        details: `Expected mysql/mariadb but got "${parsed.protocol}".`,
      },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      message: 'Database connection is healthy.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error.';
    return NextResponse.json(
      { ok: false, error: 'Database connection check failed.', details: message },
      { status: 503 }
    );
  }
}
