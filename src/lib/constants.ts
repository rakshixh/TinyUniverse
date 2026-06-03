// ─── Validation ───────────────────────────────────────────────
export const MAX_TITLE_LENGTH       = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;

// ─── Cookie ───────────────────────────────────────────────────
export const ADMIN_COOKIE_NAME = 'tiny_universe_admin_session';
export const ADMIN_COOKIE_VALUE = 'authenticated';

// ─── API Paths ────────────────────────────────────────────────
export const API_PATHS = {
  memories:       '/api/memories',
  memory:         (id: string) => `/api/memories/${id}`,
} as const;
