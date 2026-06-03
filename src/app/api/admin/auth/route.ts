import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { CONTENT } from '@/lib/content';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check for logout request
    if (body.action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.set(ADMIN_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    const { passcode } = body;

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json(
        { error: CONTENT.api.errors.required.passcode },
        { status: 400 }
      );
    }

    const correctPasscode = process.env.MASTER_PASSCODE || process.env.UNIVERSE_PASSCODE;

    if (!correctPasscode) {
      console.error('MASTER_PASSCODE / UNIVERSE_PASSCODE is not configured in environment');
      return NextResponse.json(
        { error: CONTENT.api.errors.server.config },
        { status: 500 }
      );
    }

    if (passcode !== correctPasscode) {
      return NextResponse.json(
        { error: CONTENT.admin.login.invalidPasscodeError },
        { status: 401 }
      );
    }

    // Set secure HttpOnly cookie (session cookie with 1-day validation built-in)
    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, `authenticated_${Date.now()}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: CONTENT.api.errors.server.internal },
      { status: 500 }
    );
  }
}
