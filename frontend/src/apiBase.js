/**
 * In dev without a proxy, set VITE_API_URL=http://localhost:3000 in .env / .env.development.
 * Leave unset to use same-origin relative /api (e.g. production behind one host).
 */

/** Sent to the API so cancel links use this origin (matches real dev port even if FRONTEND_URL is wrong). */
export function frontendOriginHeader() {
  if (typeof window === 'undefined') return {};
  try {
    return { 'X-Frontend-Origin': window.location.origin };
  } catch {
    return {};
  }
}

export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
