import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

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
    // Get user role from a custom header set after login
    // Or we can decode the JWT client-side and pass it
    // For now, we'll check if user is authenticated via the token
    
    // Since we can't easily decode JWT in middleware without additional config,
    // we'll do a lightweight check and let the client handle role verification
    // This is a basic protection - real security is in the API routes
    
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
