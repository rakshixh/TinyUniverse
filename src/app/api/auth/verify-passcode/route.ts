import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      );
    }

    const correctPasscode = process.env.UNIVERSE_PASSCODE;

    if (!correctPasscode) {
      console.error('UNIVERSE_PASSCODE environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (passcode !== correctPasscode) {
      return NextResponse.json(
        { error: 'Invalid passcode' },
        { status: 401 }
      );
    }

    // Set secure HttpOnly cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set(SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
