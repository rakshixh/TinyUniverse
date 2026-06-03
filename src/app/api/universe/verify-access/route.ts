import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getRawUniverseBySlug } from '@/services/universe.service';

/** POST /api/universe/verify-access — Validate guest access code */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, passcode } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Universe slug is required' }, { status: 400 });
    }

    if (!passcode || typeof passcode !== 'string') {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }

    // Fetch the universe (with the raw accessCodeHash)
    const universe = await getRawUniverseBySlug(slug);

    if (!universe) {
      return NextResponse.json({ error: 'Universe not found' }, { status: 404 });
    }

    // Verify access code using bcrypt
    const isValid = bcrypt.compareSync(passcode, universe.accessCodeHash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    // Set secure HttpOnly cookie (session cookie with 1-day validation and passcode hash comparison)
    const response = NextResponse.json({ success: true, universeId: universe._id });

    response.cookies.set(`universe_${universe._id}`, `${universe.accessCodeHash}_${Date.now()}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Verify access error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
