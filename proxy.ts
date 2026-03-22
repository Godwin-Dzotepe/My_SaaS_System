import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Role-based route protection
// Define which routes require which roles
const roleBasedRoutes: Record<string, string[]> = {
  '/dashboard/super-admin': ['super_admin'],
  '/dashboard/school-admin': ['school_admin', 'super_admin'],
  '/dashboard/teacher': ['teacher', 'school_admin', 'super_admin'],
  '/dashboard/secretary': ['secretary', 'school_admin', 'super_admin'],
  '/dashboard/parent': ['parent'],
  '/dashboard/finance-admin': ['finance_admin', 'school_admin', 'super_admin'],
};

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/parent-first-login',
];

function getDashboardRoute(role?: string) {
  switch (role) {
    case 'super_admin':
      return '/dashboard/super-admin';
    case 'school_admin':
      return '/dashboard/school-admin';
    case 'finance_admin':
      return '/dashboard/finance-admin';
    case 'teacher':
      return '/dashboard/teacher';
    case 'secretary':
      return '/dashboard/secretary';
    case 'parent':
      return '/dashboard/parent';
    default:
      return '/auth/login';
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get token from cookie or header
  const token = request.cookies.get('token')?.value;
  const verifiedUser = token ? verifyToken(token) : null;

  if (token && !verifiedUser) {
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid session' }, { status: 401 })
      : NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Keep authenticated users out of public auth screens
  if (publicPaths.some(path => pathname.startsWith(path))) {
    if (verifiedUser && (pathname === '/' || pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
      return NextResponse.redirect(new URL(getDashboardRoute(verifiedUser.role), request.url));
    }
    return NextResponse.next();
  }

  // If no token, redirect to login for protected routes
  if (!token) {
    // Check if it's an API route
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // For API routes, we'll let the individual API handlers verify the token
  // But we can add additional checks here if needed
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // For dashboard routes, verify role
  if (pathname.startsWith('/dashboard/')) {
    const matchingRoute = Object.keys(roleBasedRoutes)
      .sort((a, b) => b.length - a.length)
      .find((route) => pathname.startsWith(route));

    if (matchingRoute && verifiedUser) {
      const allowedRoles = roleBasedRoutes[matchingRoute];
      if (!allowedRoles.includes(verifiedUser.role)) {
        return NextResponse.redirect(new URL(getDashboardRoute(verifiedUser.role), request.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
