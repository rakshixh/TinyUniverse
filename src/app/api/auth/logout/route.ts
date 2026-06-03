import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { CONTENT } from '@/lib/content';

/**
 * POST /api/auth/logout — Clears admin and guest cookies.
 * This is invoked by SessionGuard when it detects a new tab/browser launch (empty sessionStorage)
 * or when the user manually logs out.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { universeId } = body;

    const response = NextResponse.json({ success: true });

    // 1. Clear Admin Session Cookie
    response.cookies.set(ADMIN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // 2. Clear Guest Session Cookie for target universe if provided
    if (universeId) {
      response.cookies.set(`universe_${universeId}`, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: CONTENT.api.errors.server.clearSession }, { status: 500 });
  }
}
