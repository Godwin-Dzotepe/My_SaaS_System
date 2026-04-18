import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { decryptSecret, verifyTotp } from '@/lib/totp';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const setupSchema = z.object({
  mode:    z.literal('setup'),
  token:   z.string().length(6),
  user_id: z.string(),
});

const loginSchema = z.object({
  mode:          z.literal('login'),
  pending_token: z.string(),
  totp_token:    z.string().length(6),
});

const bodySchema = z.discriminatedUnion('mode', [setupSchema, loginSchema]);

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

function setCsrfCookie(response: NextResponse): void {
  const csrfToken = crypto.randomUUID();
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60,
    path:     '/',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // ── Mode A: Setup completion (user already authenticated, just verifying token) ──
    if (parsed.data.mode === 'setup') {
      const { token: totpToken, user_id } = parsed.data;

      const record = await prisma.userTotpSecret.findUnique({
        where:  { user_id },
        select: { secret: true, verified: true },
      });

      if (!record) {
        return NextResponse.json({ error: 'No pending 2FA setup found.' }, { status: 404 });
      }

      const secret = decryptSecret(record.secret);
      if (!verifyTotp(totpToken, secret)) {
        return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 400 });
      }

      await prisma.userTotpSecret.update({
        where: { user_id },
        data:  { verified: true },
      });

      logAudit({
        prismaClient: prisma,
        performedBy:  user_id,
        action:       'UPDATE',
        entityType:   '2FA',
        entityId:     user_id,
        changes:      { after: { event: '2FA_ENABLED' } },
      });

      return NextResponse.json({ message: '2FA enabled successfully.' });
    }

    // ── Mode B: Login step (complete login after password check) ──────────────
    const { pending_token, totp_token } = parsed.data;

    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(pending_token, getJwtSecret(), { algorithms: ['HS256'] }) as jwt.JwtPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired pending token.' }, { status: 401 });
    }

    if (decoded.type !== '2fa_pending' || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid pending token type.' }, { status: 401 });
    }

    const userId = decoded.userId as string;

    const [record, user] = await Promise.all([
      prisma.userTotpSecret.findUnique({
        where:  { user_id: userId },
        select: { secret: true, verified: true },
      }),
      prisma.user.findUnique({
        where:  { id: userId },
        select: { id: true, role: true, school_id: true, email: true, phone: true, name: true },
      }),
    ]);

    if (!record?.verified || !user) {
      return NextResponse.json({ error: 'Invalid or expired pending token.' }, { status: 401 });
    }

    const secret = decryptSecret(record.secret);
    if (!verifyTotp(totp_token, secret)) {
      return NextResponse.json({ error: 'Invalid authenticator code.' }, { status: 401 });
    }

    const token = generateToken({
      userId:   user.id,
      email:    user.email || '',
      role:     user.role,
      schoolId: user.school_id || '',
      phone:    user.phone,
    });

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      message: 'Login successful',
      user:    { id: user.id, name: user.name, role: user.role },
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60,
      path:     '/',
    });

    setCsrfCookie(response);
    return response;

  } catch (err) {
    logger.error('[2FA Verify] Unexpected error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
