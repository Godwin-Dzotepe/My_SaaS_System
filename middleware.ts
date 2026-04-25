import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'kobby.dev';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Strip port for local dev
  const host = hostname.split(':')[0];

  // Check if this request is on a custom subdomain (e.g. gracelife.kobby.dev)
  if (host.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = host.slice(0, -(BASE_DOMAIN.length + 1));
    // Ignore www
    if (subdomain && subdomain !== 'www') {
      const res = NextResponse.next();
      res.headers.set('x-school-subdomain', subdomain);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
