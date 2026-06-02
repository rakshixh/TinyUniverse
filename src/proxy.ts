import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /universe routes
  if (pathname.startsWith('/universe')) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME);
    const isAuthenticated = cookie?.value === SESSION_COOKIE_VALUE;

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/universe/:path*'],
};
