import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { createTokenHash } from '@/lib/auth';
import { logger } from '@/lib/logger';

const COOKIE_NAMES = ['token', 'auth_token', 'csrf_token'];

function clearAuthCookies(response: NextResponse): void {
  const isProd = process.env.NODE_ENV === 'production';
  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, '', {
      httpOnly: name !== 'csrf_token',
      secure: isProd,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
  }
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });

  // Try to blacklist the token so it can't be reused even if someone kept a copy
  const token =
    req.cookies.get('token')?.value ||
    req.cookies.get('auth_token')?.value;

  if (token) {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback: 7 days from now

      const tokenHash = createTokenHash(token);

      await prisma.tokenBlacklist.upsert({
        where:  { token_hash: tokenHash },
        create: { token_hash: tokenHash, expires_at: expiresAt },
        update: {},
      });
    } catch (err) {
      // Don't block logout if blacklisting fails
      logger.warn('[Logout] Failed to blacklist token', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  clearAuthCookies(response);
  return response;
}
