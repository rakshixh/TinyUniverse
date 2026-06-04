import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE } from '@/lib/constants';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin API routes (except auth login/logout)
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth') {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
    let isAdminAuthenticated = false;
    
    if (cookie) {
      const val = cookie.value;
      if (val === ADMIN_COOKIE_VALUE) {
        isAdminAuthenticated = true;
      } else if (val.startsWith('authenticated_')) {
        const parts = val.split('_');
        const timestamp = parseInt(parts[1], 10);
        if (!isNaN(timestamp)) {
          const oneDayMs = 24 * 60 * 60 * 1000;
          isAdminAuthenticated = Date.now() - timestamp <= oneDayMs;
        }
      }
    }

    if (!isAdminAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
