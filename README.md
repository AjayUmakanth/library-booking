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

frontend/       # React SPA — Vite dev server on port 3001
  src/
    apiBase.js  # prepends VITE_API_URL to /api requests when set
  public/
  vite.config.js
```

## Quick start

### 1. Backend

```bash
cd backend
copy .env.example .env
# Set JWT_SECRET to a long random string (required in production)
npm install
npm run seed -- 3
npm run dev
```

API: **`http://localhost:3000`** — JSON routes under **`/api/...`**. **`GET /`** returns a short JSON description and health pointer.

**Seed:** `npm run seed -- <numberOfRooms>` asks for **`y`** to confirm wiping **all bookings and rooms** and inserting **`Room 1` … `Room N`**. A second prompt asks whether to delete **all users** (`y` yes, anything else keeps accounts). Example: `npm run seed -- 5`.

### 2. Frontend

In a **second** terminal:

```bash
cd frontend
copy .env.example .env
# Optional: .env.development already sets VITE_API_URL for local dev
npm install
npm run dev
```

App: **`http://localhost:3001`**. Use **Register** to create a user after seeding (the seed script does not add accounts).

There is **no Vite proxy**: the browser calls the API directly at **`VITE_API_URL`** (see **`frontend/.env.example`**). Express **`FRONTEND_ORIGIN`** / dev defaults must allow that UI origin (see **`backend/.env.example`**). JWTs are sent via the **`Authorization`** header (not cookies).

## Environment variables

**`backend/.env`** (see **`backend/.env.example`**)

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default `3000`) |
| `NODE_ENV` | Set `production` only for deployed builds (affects CORS defaults) |
| `JWT_SECRET` | Signing key for access tokens (required in production) |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`, `24h`; passed to `jsonwebtoken`) |
| `APP_TIMEZONE` | IANA timezone for "today", slots, and session logic (default `Europe/Berlin`) |
| `FRONTEND_URL` | Fallback for cancel / confirmation URLs when the client does not send a browser tab origin (e.g. curl). The SPA sends **`X-Frontend-Origin`**, which always matches **`window.location.origin`**, so links follow the port you actually opened even if this value is outdated. |
| `FRONTEND_ORIGIN` | Browser origin(s) for CORS; comma-separated if needed. Must match the address bar (e.g. `http://localhost:3001` vs `http://127.0.0.1:3001`) |
| `SQLITE_PATH` | Optional DB file path |

**`frontend/.env`** or **`.env.development`** (see **`frontend/.env.example`**)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API origin without trailing slash (dev: `http://localhost:3000`). Omit or leave empty for production when the API is served on the **same host** as the static app so requests can use relative `/api`. |

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
- Set **`NODE_ENV=production`**, **`FRONTEND_ORIGIN`**, and **`FRONTEND_URL`** to your real public UI URL(s). In production the backend does **not** use the extra localhost dev origins from code.
- Storing JWTs in **`localStorage`** is vulnerable to **XSS**; mitigations include CSP, sanitizing HTML, and (for stricter setups) **httpOnly cookies** with a BFF or short-lived tokens + refresh rotation.
- There is **no server-side logout / token revocation** in this MVP; compromised tokens stay valid until they expire unless you add a blocklist or versioning.

## Known limitations

- MVP: no refresh tokens, no token revocation, no automated tests.
