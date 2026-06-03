import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';

/** GET /api/auth/status — Check admin status and guest-unlocked universes */
export async function GET(request: NextRequest) {
  try {
    const isUserAdmin = isAdmin(request);
    
    // Find all cookies starting with 'universe_'
    const unlockedUniverses: string[] = [];
    const allCookies = request.cookies.getAll();
    
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('universe_') && cookie.value === 'true') {
        const universeId = cookie.name.replace('universe_', '');
        unlockedUniverses.push(universeId);
      }
    });

    return NextResponse.json({
      isAdmin: isUserAdmin,
      unlockedUniverses,
    }, { status: 200 });
  } catch (err) {
    console.error('Auth status check error:', err);
    return NextResponse.json({ isAdmin: false, unlockedUniverses: [] }, { status: 200 });
  }
}
