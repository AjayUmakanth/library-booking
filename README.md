# Room booking system

A room booking prototype with a **React (Vite) frontend** and **Express + SQLite API** running on separate dev servers.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18, React Router 6, Vite 5, Bootstrap 5 (CDN) |
| Backend | Node.js, Express, **JWT** (`jsonwebtoken`), bcrypt |
| Database | SQLite (`better-sqlite3`) |

## Authentication

- **Login** and **register** return `{ user, token }`. The token is a signed JWT (default lifetime **7 days**, configurable).
- Protected API routes expect: **`Authorization: Bearer <token>`**.
- The React app stores the token in **`localStorage`** and attaches it to booking/`/me` requests. **`POST /api/auth/logout`** is a no-op on the server; the client clears the token.
- Cancellation links remain **opaque tokens** in the URL (unchanged).

## Repository layout

```
backend/          # JSON API on PORT (default 3000)
  src/
    app.js
    routes/ controllers/ services/ repositories/ middleware/ utils/
    db/  (schema.sql, sqlite.js, seed.js)
  data/app.db   # created on first run (gitignored)

frontend/       # React SPA on port 5173 (Vite dev server)
  src/
  vite.config.js  # proxies /api → backend
```

## Quick start

### 1. Backend

```bash
cd backend
copy .env.example .env
# Set JWT_SECRET to a long random string (required in production)
npm install
npm run seed
npm run dev
```

API: `http://localhost:3000` — routes are under `/api/...`.

### 2. Frontend

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

The Vite dev server proxies `/api` to `http://localhost:3000`. JWTs are sent on each request via the **`Authorization`** header (no cookie session).

### 3. Demo user (after seed)

- Email: `demo@example.com`
- Password: `Demo123!`

## Environment variables

**`backend/.env`**

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `3000`) |
| `JWT_SECRET` | Signing key for access tokens (required in production) |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`, `24h`; passed to `jsonwebtoken`) |
| `APP_TIMEZONE` | IANA timezone for “today”, slots, and ongoing sessions (default `Europe/Berlin`) |
| `FRONTEND_URL` | Used in confirmation cancel links (default `http://localhost:5173`) |
| `FRONTEND_ORIGIN` | CORS origin (default `http://localhost:5173`) |
| `SQLITE_PATH` | Optional DB file path |

## API overview

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/register` | — (returns `token`) |
| POST | `/api/auth/login` | — (returns `token`) |
| POST | `/api/auth/logout` | — (client discards token) |
| GET | `/api/auth/me` | optional `Bearer` |
| GET | `/api/bookings/available?date=` | `Bearer` |
| POST | `/api/bookings` | `Bearer` |
| GET | `/api/bookings/mine` | `Bearer` |
| GET | `/api/bookings/success/:id` | `Bearer` |
| POST | `/api/bookings/:id/cancel` | `Bearer` |
| GET/POST | `/api/cancel/:token` | — (POST cancels) |

## Business rules

Opening hours 07:00–21:00, whole hours, 1–6 hour blocks, no overlaps (`newStart < existingEnd && newEnd > existingStart`), dates within today + 7 days, users only manage their own bookings, plus secret cancel links.

## Production notes

- Use a strong **`JWT_SECRET`** and HTTPS. Shorten **`JWT_EXPIRES_IN`** if you need tighter security.
- Storing JWTs in **`localStorage`** is vulnerable to **XSS**; mitigations include CSP, sanitizing HTML, and (for stricter setups) **httpOnly cookies** with a BFF or short-lived tokens + refresh rotation.
- There is **no server-side logout / token revocation** in this MVP; compromised tokens stay valid until they expire unless you add a blocklist or versioning.

## Known limitations

- MVP: no refresh tokens, no token revocation, no automated tests.
