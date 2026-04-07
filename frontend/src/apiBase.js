/**
 * In dev without a proxy, set VITE_API_URL=http://localhost:3000 in .env / .env.development.
 * Leave unset to use same-origin relative /api (e.g. production behind one host).
 */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
