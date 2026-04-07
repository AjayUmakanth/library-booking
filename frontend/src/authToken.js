const STORAGE_KEY = 'library_booking_jwt';

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(STORAGE_KEY, token);
  else localStorage.removeItem(STORAGE_KEY);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function authHeaders() {
  const t = getToken();
  if (!t) return {};
  return { Authorization: `Bearer ${t}` };
}

/** Merge JSON + bearer headers for fetch */
export function jsonAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    ...authHeaders(),
  };
}
