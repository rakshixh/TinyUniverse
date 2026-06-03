import { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE } from './constants';
import connectDB from './mongodb';
import Universe from '@/models/Universe';

/**
 * Checks if the generic cookies store contains a valid admin session.
 */
export function checkAdminSession(cookies: { get(name: string): { value: string } | undefined }): boolean {
  const cookie = cookies.get(ADMIN_COOKIE_NAME);
  if (!cookie) return false;

  const value = cookie.value;
  if (value === ADMIN_COOKIE_VALUE) {
    return true; // Backward compatibility for existing sessions
  }

  if (value.startsWith('authenticated_')) {
    const parts = value.split('_');
    const timestamp = parseInt(parts[1], 10);
    if (isNaN(timestamp)) return false;
    
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - timestamp <= oneDayMs;
  }

  return false;
}

/**
 * Checks if the request contains a valid admin session cookie.
 * Admin sessions also expire after 1 day maximum.
 */
export function isAdmin(request: NextRequest): boolean {
  return checkAdminSession(request.cookies);
}

/**
 * Checks if the generic cookies store contains a valid guest access session.
 */
export async function checkGuestSession(
  cookies: { get(name: string): { value: string } | undefined },
  universeId: string,
  expectedHash: string
): Promise<boolean> {
  if (checkAdminSession(cookies)) return true;
  const cookie = cookies.get(`universe_${universeId}`);
  if (!cookie) return false;

  const value = cookie.value;
  if (value === 'true') {
    return true; // Backward compatibility
  }

  const parts = value.split('_');
  const hash = parts[0];
  const timestampStr = parts[1];

  if (!hash || !timestampStr) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max 1 day (24 hours) session lifetime check
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > oneDayMs) {
    return false;
  }

  return hash === expectedHash;
}

/**
 * Checks if the request contains a valid access cookie for a specific universe.
 * Compares against database accessCodeHash to support instant logout on passcode changes.
 * Enforces a 1-day maximum session duration.
 */
export async function hasUniverseAccess(request: NextRequest, universeId: string): Promise<boolean> {
  if (isAdmin(request)) return true;
  
  // Verify dynamic code hash against the database
  try {
    await connectDB();
    const universe = await Universe.findById(universeId).select('accessCodeHash').lean();
    if (!universe) return false;

    return checkGuestSession(request.cookies, universeId, universe.accessCodeHash);
  } catch (err) {
    console.error('Database auth validation error:', err);
    return false;
  }
}

/**
 * Checks if the request is authorized (either Admin or Guest with access to the specific universe).
 */
export async function isAuthorized(request: NextRequest, universeId: string): Promise<boolean> {
  return isAdmin(request) || await hasUniverseAccess(request, universeId);
}
