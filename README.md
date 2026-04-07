# Library room booking

## Overview

Prototype web app for **booking library-style rooms** by date and time slot. Users register, sign in, view availability per room, create bookings, manage their reservations, and cancel via a signed-in flow or a **secret link** (opaque token).  

The UI is themed for a university-library context (Universität Paderborn–style branding); this is a **demo**, not an official university system.

## Technologies

| Area | Stack |
|------|--------|
| **Frontend** | React 18, React Router 6, Vite 5, Bootstrap 5 (CDN) |
| **Backend** | Node.js 18+, Express 4 |
| **Auth** | JWT (`jsonwebtoken`), bcrypt password hashes |
| **Database** | SQLite via `better-sqlite3` |
| **Dev UX** | Separate dev servers (API + SPA), CORS, optional `X-Frontend-Origin` for correct cancel-link URLs |

## Running locally

### Prerequisites

- **Node.js 18 or newer** (see `engines` in `backend/package.json`)
- **npm** (bundled with Node)

Native module: **`better-sqlite3`** compiles for your Node version; if install fails, run `npm install` again after switching Node versions or use `npm rebuild`.

### Backend

```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env
# Set JWT_SECRET (required for anything beyond casual local use)
npm install
npm run seed -- 3             # confirm with y; second prompt: whether to delete users
npm run dev
```

- API base: `http://localhost:3000` (default; override with `PORT` in `.env`).
- **`GET /`** — small JSON describing the service; **`GET /api/health`** — `{ "ok": true }`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App URL: **`http://localhost:3001`** (see `vite.config.js`).
- Configure API target with **`VITE_API_URL`** (see `frontend/.env.example`; dev default is in `.env.development`).
- **Register** a user after seeding; the seed script only creates rooms (and optionally wipes users).

### Environment files

- **Backend:** `backend/.env.example` → copy to `.env` (`FRONTEND_URL`, `FRONTEND_ORIGIN`, `JWT_SECRET`, etc.).
- **Frontend:** `frontend/.env.example` / `.env.development` — mainly **`VITE_API_URL=http://localhost:3000`**.

## Architecture and design decisions backend

- **Layered structure:** `routes` → `controllers` (HTTP) → `services` (rules) → `repositories` (SQL) keeps booking logic and persistence separate and easier to test or swap later.
- **SQLite + single file:** Low setup cost; `schema.sql` applied on startup; a small migration rebuilds legacy `rooms` to `id` + `name` only when needed.
- **JWT in `Authorization` bearer header:** Stateless API; no cookie session. Logout is client-side token discard (`POST /api/auth/logout` is a no-op).
- **Timezone:** `APP_TIMEZONE` drives “today”, opening hours, and overlap logic so server behavior matches a chosen locale.
- **CORS:** Configured for cross-origin dev (SPA on 3001, API on 3000). Custom header **`X-Frontend-Origin`** is allowed so cancel and confirmation URLs can match the real browser origin even if `FRONTEND_URL` is stale.
- **Cancel links:** Long random **`cancel_token`** in the URL; **`GET/POST /api/cancel/:token`** do not require login (anyone with the link can cancel). Authenticated users also get **`cancelUrl`** on booking success and on **My bookings** so the same cancel page is used as for shared links.
- **Seed script:** Interactive: always deletes **bookings** and **rooms**; second prompt controls whether **users** are deleted; then inserts `Room 1 … Room N`.

## Architecture and design decisions frontend

- **SPA + client routing:** Protected routes wrap booking pages; home redirects by auth state.
- **API base helper (`apiUrl`):** Uses `VITE_API_URL` in dev so `/api` calls hit the Express server; production can omit it when UI and API share one origin.
- **`frontendOriginHeader()`:** Every relevant `fetch` sends the tab’s origin so the server can build correct absolute cancel links.
- **UI:** Bootstrap for layout; institutional green theme and local branding assets under `public/branding/`.

## AI tools

Parts of this repository (code, README, and related edits) were produced or refined with **AI-assisted editing** (e.g. **Cursor** and large language models). Generated content was reviewed and integrated into the project manually; behavior should always be verified by running the app and tests if you add them.

## Known limitations and open issues

- **No refresh tokens**; access tokens are valid until **`JWT_EXPIRES_IN`** with **no server-side revocation** (no logout blocklist).
- **JWTs in `localStorage`** are convenient but **XSS-sensitive**; production hardening would use tighter CSP, httpOnly cookies, or short-lived tokens + refresh flows.
- **No automated tests** in the repository.
- **Cancel by token** is powerful: anyone with the link can cancel; links must be treated like secrets.
- **Production deployment** not documented here; you would set `NODE_ENV=production`, real **`FRONTEND_ORIGIN`** / **`FRONTEND_URL`**, HTTPS, and a strong **`JWT_SECRET`**.

## REST API reference

Base path: **`/api`** (except `GET /` and `GET /api/health` on the same host as the API).

Unless noted, JSON bodies/responses use `application/json`. Protected booking routes expect:

```http
Authorization: Bearer <jwt>
```

The SPA also sends **`X-Frontend-Origin: <tab origin>`** where applicable so cancel URLs match the UI.

### General

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Service blurb, `health` path, CORS hint. |
| GET | `/api/health` | — | `{ "ok": true }`. |

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Body: user fields. Returns `{ user, token }`. |
| POST | `/api/auth/login` | — | Body: `email`, `password`. Returns `{ user, token }`. |
| POST | `/api/auth/logout` | — | No-op server-side; client drops token. |
| GET | `/api/auth/me` | Optional Bearer | Current user or 401 if invalid/missing token. |

### Bookings (`/api/bookings`)

All routes use **`requireAuth`** (valid Bearer required).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bookings/available?date=YYYY-MM-DD` | Availability grid: rooms, slots, selected date bounds, timezone. |
| POST | `/api/bookings` | Create booking (room, date, start, duration, purpose). Returns `{ booking, cancelUrl }`. |
| GET | `/api/bookings/mine` | `{ future, past }`; future items include **`cancelUrl`**. |
| GET | `/api/bookings/success/:id` | Booking detail + **`cancelUrl`** for confirmation screen. |
| POST | `/api/bookings/:id/cancel` | Cancel as owner (still available API-side; main UI uses token cancel link). |

### Public cancel (`/api/cancel`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cancel/:token` | Load booking preview for cancel page (no JWT). |
| POST | `/api/cancel/:token` | Perform cancellation (no JWT). |

### Errors

- **4xx/5xx** responses typically include JSON `{ error: "..." }` or `{ errors: { field: "..." } }` for validation.
- Unknown **`/api/...`** routes: **`404`** `{ "error": "Not found" }`.
- Unhandled server error: **`500`** `{ "error": "An unexpected error occurred." }`.

### Business rules (enforced in services)

- Opening hours **07:00–21:00**, whole hours, **1–6** hour blocks.  
- **No overlapping** bookings per room/date.  
- Booking dates within **today + 7 days** (per validation).  
- Users may only read/cancel **their own** bookings on authenticated routes; cancel token bypasses login but targets one booking.
