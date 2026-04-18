import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { decryptSecret, verifyTotp } from '@/lib/totp';
import { logAudit } from '@/lib/audit';
import { getClientIp } from '@/lib/rate-limiter';
import { z } from 'zod';

const schema = z.object({ totp_token: z.string().length(6) });

export const DELETE = withAuth(async ({ req, session }) => {
  const { id: userId } = session.user;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'totp_token (6 digits) is required' }, { status: 400 });
  }

  const record = await prisma.userTotpSecret.findUnique({
    where:  { user_id: userId },
    select: { secret: true, verified: true },
  });

  if (!record?.verified) {
    return NextResponse.json({ error: '2FA is not enabled on this account.' }, { status: 404 });
  }

  const secret = decryptSecret(record.secret);
  if (!verifyTotp(parsed.data.totp_token, secret)) {
    return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 });
  }

  await prisma.userTotpSecret.delete({ where: { user_id: userId } });

  logAudit({
    prismaClient: prisma,
    schoolId:     session.user.school_id ?? undefined,
    performedBy:  userId,
    actorRole:    session.user.role,
    action:       'DELETE',
    entityType:   '2FA',
    entityId:     userId,
    changes:      { before: { event: '2FA_DISABLED' } },
    ipAddress:    getClientIp(req),
  });

  return NextResponse.json({ message: '2FA disabled successfully.' });
});
