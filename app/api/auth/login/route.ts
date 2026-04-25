import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { generateToken } from '@/lib/auth';
import { findUserWithSchoolBranding } from '@/lib/school-branding';
import { generateRandomPassword } from '@/lib/password-utils';
import { check, getClientIp, LOGIN_LIMITER } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

/**
 * Input validation schema
 */
const loginSchema = z.object({
  identifier: z.string().min(3, 'Identifier must be at least 3 characters'),
  password:   z.string().min(6, 'Password must be at least 6 characters'),
  schoolId:   z.string().optional(),
});

const TEMP_PASSWORD_EXPIRY_HOURS = 5;
const TWO_FA_ROLES = new Set(['school_admin', 'finance_admin']);

async function findLoginUser(where: Record<string, unknown>) {
  try {
    return await findUserWithSchoolBranding(where);
  } catch (error) {
    logger.warn('[Login] Branding-aware lookup failed, falling back to base school lookup', {
      error: error instanceof Error ? error.message : String(error),
    });

    return prisma.user.findFirst({
      where,
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    });
  }
}

function setCsrfCookie(response: NextResponse, isHttps: boolean): void {
  const csrfToken = crypto.randomUUID();
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: false,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * POST /api/auth/login
 */
export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const ipRl = check(`login:${ip}`, LOGIN_LIMITER.limit, LOGIN_LIMITER.windowMs);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(ipRl.retryAfterMs / 1000)) },
      }
    );
  }

  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { identifier, password, schoolId } = validation.data;

    // Per-identifier rate limit to slow credential stuffing
    const idRl = check(`login_id:${identifier}`, 20, 15 * 60 * 1000);
    if (!idRl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts for this account. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(idRl.retryAfterMs / 1000)) } }
      );
    }

    const userWhere: Record<string, unknown> = {
      OR: [{ email: identifier }, { phone: identifier }],
    };
    if (schoolId) userWhere.school_id = schoolId;

    const user = await findLoginUser(userWhere);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if school has been deactivated
    if (user.role !== 'super_admin' && user.school && user.school.isActive === false) {
      const msg =
        user.school.deactivationMessage ||
        "This school's account has been deactivated by the system administrator.";
      return NextResponse.json({ error: `SCHOOL_DEACTIVATED:${msg}` }, { status: 403 });
    }

    // Enforce parent temporary-password expiry (5 hours)
    if (user.role === 'parent' && user.temporary_password) {
      const generatedAtMs = user.password_generated_at
        ? new Date(user.password_generated_at).getTime()
        : 0;
      const expiresAt = generatedAtMs + TEMP_PASSWORD_EXPIRY_HOURS * 60 * 60 * 1000;
      const isExpired = !generatedAtMs || Date.now() > expiresAt;

      if (isExpired) {
        const randomLockPassword  = generateRandomPassword();
        const lockedHashedPassword = await bcrypt.hash(randomLockPassword, 10);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: lockedHashedPassword,
            temporary_password: null,
            password_generated_at: null,
          },
        });

        return NextResponse.json(
          {
            error:
              'Your temporary password has expired after 5 hours. Please contact your school admin to reset your parent password.',
          },
          { status: 401 }
        );
      }
    }

    // Verify password
    if (typeof user.password !== 'string' || user.password.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // ── 2FA check for eligible roles ────────────────────────────────────────
    if (TWO_FA_ROLES.has(user.role)) {
      const totpRecord = await prisma.userTotpSecret.findUnique({
        where:  { user_id: user.id },
        select: { verified: true },
      });

      if (totpRecord?.verified) {
        // Issue a short-lived pending token instead of a full session token
        const secret = process.env.JWT_SECRET!;
        const pendingToken = jwt.sign(
          { userId: user.id, type: '2fa_pending' },
          secret,
          { expiresIn: '5m', algorithm: 'HS256' }
        );
        return NextResponse.json({ requires2fa: true, pending_token: pendingToken }, { status: 200 });
      }
    }

    // Generate full JWT token
    const token = generateToken({
      userId:   user.id,
      email:    user.email || '',
      role:     user.role,
      schoolId: user.school_id || '',
      phone:    user.phone,
    });

    const { password: _, ...userWithoutPassword } = user;
    const schoolData = user.school as { school_name?: string; logo_url?: string | null } | null | undefined;

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        schoolName:    schoolData?.school_name,
        schoolLogoUrl: schoolData?.logo_url ?? null,
      },
      token,
    });

    const isHttps = req.headers.get('x-forwarded-proto') === 'https' ||
      req.url.startsWith('https://');
    response.cookies.set('token', token, {
      httpOnly: true,
      secure:   isHttps,
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60,
      path:     '/',
    });

    setCsrfCookie(response, isHttps);
    return response;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Login] Unexpected error', { error: message });

    if (message.includes('DATABASE_URL protocol')) {
      return NextResponse.json(
        { error: 'Server database is misconfigured. Please use a MySQL/MariaDB DATABASE_URL.' },
        { status: 500 }
      );
    }

    if (
      message.toLowerCase().includes('prisma') ||
      message.includes('ECONNREFUSED') ||
      message.toLowerCase().includes('connect') ||
      message.toLowerCase().includes('pool timeout')
    ) {
      return NextResponse.json(
        { error: 'Database connection error. Please check your database settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
