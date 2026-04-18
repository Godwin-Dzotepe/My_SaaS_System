import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { prisma } from './prisma';
import { logger } from './logger';

// Define a session object structure for clarity
export interface Session {
  user: {
    id: string;
    role: string;
    school_id: string | null;
    phone?: string;
  };
}

// The handler function that `withAuth` will wrap
type AuthHandler = (params: {
  req: NextRequest;
  params?: any;
  session: Session;
}) => Promise<NextResponse>;

// Options for the `withAuth` HOC
interface AuthOptions {
  roles?: string[];
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_ENFORCEMENT = (process.env.CSRF_ENFORCEMENT ?? 'report-only') as 'strict' | 'report-only' | 'off';

/**
 * Check the CSRF double-submit cookie for state-mutating requests.
 * Returns true if the check passes (or is not required for this request).
 */
function checkCsrf(req: NextRequest): boolean {
  if (CSRF_ENFORCEMENT === 'off') return true;
  if (!MUTATING_METHODS.has(req.method)) return true;

  // Public auth endpoints do not require CSRF (they ARE the login step)
  const pathname = req.nextUrl?.pathname ?? '';
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/parent') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/register') ||
    pathname.startsWith('/api/book-demo') ||
    pathname.startsWith('/api/auth/2fa/verify')
  ) {
    return true;
  }

  const headerToken = req.headers.get('x-csrf-token') ?? '';
  const cookieToken = req.cookies.get('csrf_token')?.value ?? '';

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    logger.warn('[CSRF] Token mismatch', {
      method: req.method,
      path: pathname,
      hasHeader: !!headerToken,
      hasCookie: !!cookieToken,
    });
    return false;
  }

  return true;
}

export async function authorize(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: { id: string; role: string; school_id: string | null; phone?: string } } | NextResponse> {
  // CSRF check for mutating requests
  const csrfOk = checkCsrf(req);
  if (!csrfOk) {
    if (CSRF_ENFORCEMENT === 'strict') {
      return NextResponse.json({ error: 'CSRF token mismatch' }, { status: 403 });
    }
    // report-only: log but allow through
  }

  const cookieStore = await cookies();

  const authHeader = req.headers.get('Authorization');
  const cookieToken =
    cookieStore.get('token')?.value ||
    req.cookies.get('token')?.value ||
    cookieStore.get('auth_token')?.value ||
    req.cookies.get('auth_token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const verifiedUser = await verifyToken(token);
  if (!verifiedUser) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const user = {
    id:        verifiedUser.userId,
    role:      verifiedUser.role,
    school_id: verifiedUser.schoolId || null,
    phone:     verifiedUser.phone,
  };

  // Always check isActive on school unless super_admin
  if (user.role !== 'super_admin') {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        school_id: true,
        school: {
          select: {
            isActive: true,
            deactivationMessage: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User does not exist' }, { status: 401 });
    }

    if (dbUser.school && dbUser.school.isActive === false) {
      return NextResponse.json(
        {
          error: 'SCHOOL_DEACTIVATED',
          message: dbUser.school.deactivationMessage || "This school's account has been deactivated.",
        },
        { status: 403 }
      );
    }

    if (!user.school_id && dbUser.school_id) {
      user.school_id = dbUser.school_id;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Access denied: insufficient permissions' }, { status: 403 });
  }

  return { user };
}

export function validateSchool(
  user: { school_id: string | null; role: string },
  targetSchoolId?: string | null
) {
  if (user.role === 'super_admin') return true;
  if (!targetSchoolId) return true;
  return user.school_id === targetSchoolId;
}

// The withAuth HOC
export function withAuth(handler: AuthHandler, options?: AuthOptions) {
  return async (req: NextRequest, { params }: { params?: any } = {}) => {
    try {
      const authResult = await authorize(req, options?.roles);
      const resolvedParams = params ? await Promise.resolve(params) : undefined;

      if (authResult && typeof authResult === 'object' && 'user' in authResult) {
        const session: Session = { user: authResult.user };
        return handler({ req, session, params: resolvedParams });
      }

      return authResult as NextResponse;
    } catch (err: unknown) {
      logger.error('[withAuth] Caught exception', {
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
}
