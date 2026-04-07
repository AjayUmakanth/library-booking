# Library room booking

## Overview

Prototype web app for **booking library-style rooms** by date and time slot. Users register, sign in, view availability per room, create bookings, manage their reservations, and cancel via a **secret link** (opaque cancel token in the URL).  

The UI is themed for a university-library context (Universität Paderborn–style branding); this is a **demo**, not an official university system.

## Technologies


| Area         | Stack                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **Frontend** | React 18, React Router 6, Vite 5, Bootstrap 5 (CDN)                                               |
| **Backend**  | Node.js 18+, Express 4                                                                            |
| **Auth**     | JWT (`jsonwebtoken`), bcrypt password hashes                                                      |
| **Database** | SQLite via `better-sqlite3`                                                                       |
| **Dev UX**   | Separate dev servers (API + SPA), CORS, optional `X-Frontend-Origin` for correct cancel-link URLs |


## Running locally

### Prerequisites

- **Node.js 18 or newer** (see `engines` in `backend/package.json`)
- **npm** (bundled with Node)

Native module: `**better-sqlite3`** compiles for your Node version; if install fails, run `npm install` again after switching Node versions or use `npm rebuild`.

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
- `**GET /**` — small JSON describing the service; `**GET /api/health**` — `{ "ok": true }`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App URL: `**http://localhost:3001**` (see `vite.config.js`).
- Configure API target with `**VITE_API_URL**` (see `frontend/.env.example`; dev default is in `.env.development`).
- **Register** a user after seeding; the seed script only creates rooms (and optionally wipes users).

### Environment files

- **Backend:** `backend/.env.example` → copy to `.env` (`FRONTEND_URL`, `FRONTEND_ORIGIN`, `JWT_SECRET`, etc.).
- **Frontend:** `frontend/.env.example` / `.env.development` — mainly `**VITE_API_URL=http://localhost:3000`**.

## Architecture and design decisions

- Backend is **Express** with layers: **routes → controllers → services → SQLite repositories**.
- **Auth** is **JWT** in the `**Authorization`** header; the API is stateless.
- `**APP_TIMEZONE**` drives “today”, opening hours, and slot/overlap rules.
- **Cancellation** uses a secret **token in the URL** and `**GET` / `POST /api/cancel/:token`** (not an authenticated “delete by booking id”).
- **Cross-origin dev:** `**X-Frontend-Origin`** on requests so **cancel URLs** match the real browser tab when SPA and API run on different ports.
- **UI:** Bootstrap; branding assets under `**public/branding/`**.
- **Seed:** Interactive script wipes **bookings** and **rooms**; optional wipe of **users**; then `**Room 1 … Room N`**.

## AI tools

- Some **code** and **documentation** were drafted or edited with **AI-assisted tools** (e.g. **Cursor** / large language models) and then **reviewed manually**.
- **Verify behavior** by running the app (and any tests you add).

## Known limitations and open issues

- **No refresh tokens** and **no server-side logout** (tokens stay valid until `**JWT_EXPIRES_IN`**).
- **JWT in `localStorage`** is convenient but **XSS-sensitive** in theory; production setups often use stricter CSP, **httpOnly** cookies, or short-lived tokens.
- **No automated tests** in this repository.
- Anyone with a **cancel link** can cancel that booking; treat links like **secrets**.

## REST API reference

Base path: `**/api`** (except `GET /` and `GET /api/health` on the same host as the API).

Unless noted, JSON bodies/responses use `application/json`. Protected booking routes expect:

```http
Authorization: Bearer <jwt>
```

The SPA also sends `**X-Frontend-Origin: <tab origin>**` where applicable so cancel URLs match the UI.

### General


| Method | Path          | Auth | Description                              |
| ------ | ------------- | ---- | ---------------------------------------- |
| GET    | `/`           | —    | Service blurb, `health` path, CORS hint. |
| GET    | `/api/health` | —    | `{ "ok": true }`.                        |


### Auth (`/api/auth`)


| Method | Path                 | Auth            | Description                                           |
| ------ | -------------------- | --------------- | ----------------------------------------------------- |
| POST   | `/api/auth/register` | —               | Body: user fields. Returns `{ user, token }`.         |
| POST   | `/api/auth/login`    | —               | Body: `email`, `password`. Returns `{ user, token }`. |
| POST   | `/api/auth/logout`   | —               | No-op server-side; client drops token.                |
| GET    | `/api/auth/me`       | Optional Bearer | Current user or 401 if invalid/missing token.         |


### Bookings (`/api/bookings`)

All routes use `**requireAuth**` (valid Bearer required).


| Method | Path                                      | Description                                                                              |
| ------ | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/api/bookings/available?date=YYYY-MM-DD` | Availability grid: rooms, slots, selected date bounds, timezone.                         |
| POST   | `/api/bookings`                           | Create booking (room, date, start, duration, purpose). Returns `{ booking, cancelUrl }`. |
| GET    | `/api/bookings/mine`                      | `{ future, past }`; future items include `**cancelUrl**`.                                |
| GET    | `/api/bookings/success/:id`               | Booking detail + `**cancelUrl**` for confirmation screen.                                |


### Public cancel (`/api/cancel`)


| Method | Path                 | Description                                    |
| ------ | -------------------- | ---------------------------------------------- |
| GET    | `/api/cancel/:token` | Load booking preview for cancel page (no JWT). |
| POST   | `/api/cancel/:token` | Perform cancellation (no JWT).                 |


### Errors

- **4xx/5xx** responses typically include JSON `{ error: "..." }` or `{ errors: { field: "..." } }` for validation.
- Unknown `**/api/...`** routes: `**404**` `{ "error": "Not found" }`.
- Unhandled server error: `**500**` `{ "error": "An unexpected error occurred." }`.

### Business rules (enforced in services)

- Opening hours **07:00–21:00**, whole hours, **1–6** hour blocks.  
- **No overlapping** bookings per room/date.  
- Booking dates within **today + 7 days** (per validation).  
- Users may only read **their own** bookings on authenticated routes; cancellation uses `**/api/cancel/:token`** (from `**cancelUrl**`), which does not require login.

