import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { generateTotpSecret, generateTotpUri, encryptSecret } from '@/lib/totp';

const ALLOWED_ROLES = ['school_admin', 'finance_admin'];

export const POST = withAuth(async ({ session }) => {
  const { id: userId, role } = session.user;

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: '2FA setup is only available for school admins and finance admins.' },
      { status: 403 }
    );
  }

  // If already verified, block re-setup (must disable first)
  const existing = await prisma.userTotpSecret.findUnique({
    where:  { user_id: userId },
    select: { verified: true },
  });

  if (existing?.verified) {
    return NextResponse.json(
      { error: '2FA is already enabled. Disable it first before setting up again.' },
      { status: 409 }
    );
  }

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true, phone: true },
  });

  const accountName = user?.email || user?.phone || userId;
  const secret      = generateTotpSecret();
  const uri         = generateTotpUri(secret, accountName);
  const encrypted   = encryptSecret(secret);

  await prisma.userTotpSecret.upsert({
    where:  { user_id: userId },
    create: { user_id: userId, secret: encrypted, verified: false },
    update: { secret: encrypted, verified: false },
  });

  return NextResponse.json({ secret, uri }, { status: 200 });
});
