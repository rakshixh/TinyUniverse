// ─── Orbit & Distribution Constants ──────────────────────────

/** Planet count thresholds that trigger next orbit ring */
export const ORBIT_THRESHOLDS = [10, 25, 50, 100] as const;

/** Radii (in px) per orbit ring — used in canvas positioning */
export const ORBIT_RADII = [160, 280, 400, 520] as const;

// ─── Validation ───────────────────────────────────────────────
export const MAX_TITLE_LENGTH       = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_UNIVERSE_TITLE_LENGTH = 100;
export const MAX_UNIVERSE_DESC_LENGTH  = 500;

// ─── Cookie ───────────────────────────────────────────────────
export const SESSION_COOKIE_NAME = 'tiny_universe_session';
export const SESSION_COOKIE_VALUE = 'authenticated';
export const ADMIN_COOKIE_NAME = 'tiny_universe_admin_session';
export const ADMIN_COOKIE_VALUE = 'authenticated';

// ─── API Paths ────────────────────────────────────────────────
export const API_PATHS = {
  verifyPasscode: '/api/auth/verify-passcode',
  universe:       '/api/universe',
  memories:       '/api/memories',
  memory:         (id: string) => `/api/memories/${id}`,
} as const;
