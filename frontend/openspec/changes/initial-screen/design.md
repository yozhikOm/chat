## Context

See proposal.md - Why. The frontend (`chatApp/`) is the untouched Vite + React 19 + TypeScript starter. The backend (Fastify + Socket.io, default port 5001) exposes `POST /api/v1/login`, `POST /api/v1/signup`, `GET /api/v1/data` (Bearer JWT). Auth is stateless: the server signs a JWT (hardcoded secret, no expiry) and never stores it, so storage is entirely client-side. CORS is open (`origin: '*'`). Backend state is in-memory and resets on restart; `admin/admin` is the seeded user.

## Goals / Non-Goals

**Goals:**
- Establish the app's entry point: login + registration against the existing API with zero new runtime dependencies.
- Persist a session across reloads and validate it on startup.
- Render a minimal authenticated view (channel list from `/api/v1/data`, current channel marked, empty message pane) that becomes the seam for the chat feature.
- Use only native `fetch` and `localStorage`; no router, no state library, no socket client yet.

**Non-Goals:**
- No chat/messaging UI, no Socket.io in the frontend.
- No routing library or page navigation beyond the auth/authenticated toggle.
- No backend changes, no refresh-token logic, no multi-device sync.
- No i18n framework; a dark theme in Russian matching the backend landing.

## Decisions

### 1. Native `fetch` + `localStorage`, no new dependencies
The three endpoints are trivial. `axios`, a state store, and a router would add surface with no payoff at this size. `fetch` errors are normalized into a small typed helper so future features add calls without reworking it.
- Considered: `axios` (rejected - one extra dep for one screen), `zustand`/Redux (rejected - single branch of UI state, React `useState` suffices).

### 2. Vite dev proxy `/api` -> backend
`vite.config.ts` gains `server.proxy: { '/api': 'http://localhost:3000' }` (overridable via `VITE_API_PROXY`). The frontend calls relative URLs (`/api/v1/login`) — no env juggling, no CORS concerns, and the same origin serves static assets now, which later allows `/socket.io` proxying (`ws: true`) for real-time chat with a one-line config change. The default target is `3000` because the backend's own `npm start` script passes no `-p` flag, so fastify-cli binds its default port (3000); the 5001 advertised in the backend README is only what the `-p` option would select, not what `make start` actually produces.
- Considered: direct calls to `http://localhost:5001` via an env `VITE_API_URL` (rejected - CORS is open today but hardcoding a dev origin pollutes prod builds).

### 3. Session shape and startup flow
Two `localStorage` keys: `token` and `username`. On app mount, presence of `token` decides which view to render; the `AppShell` then validates the token by calling `GET /api/v1/data`. A 401 clears both keys and returns to the entry screen; a network failure keeps the session and shows an error (per spec: "Transient server failure").

```
+----------------+     token?      +----------------+
|  LoginPage     |  -------------> |    AppShell     |
|  (Вход/Регистрация)|              +----------------+
|                |  <------------- | header: user + logout
+----------------+   no/invalid    | channels from /data
      |                            | message pane (empty stub)
      v login/signup success
   persist token + username
```

### 4. Error handling contract in `api/auth.ts`
Each call throws a structured error carrying the HTTP status, and the UI maps status to the agreed Russian messages (401 credentials / 409 username taken / network unreachable). Only `getData`'s 401 triggers a session clear; login/signup errors never mutate stored state.

### 5. File layout
- `src/api/auth.ts` - `login()`, `signup()`, `fetchData()` + error type.
- `src/App.tsx` - token gateway: renders `LoginPage` or `AppShell`, owns login/logout state transitions.
- `src/pages/LoginPage.tsx` - tabbed form, loading state, error line.
- `src/pages/AppShell.tsx` - loads `/data` on mount, header + channel list + empty message stub.
- `src/index.css` / `src/App.css` - replaced with a compact dark theme (CSS variables).

## Risks / Trade-offs

- [In-memory backend resets on restart] -> stale tokens are rejected with 401 by `getData`; the startup validation path clears them automatically.
- [Tokens never expire and live in `localStorage`] -> XSS would expose the session. Acceptable for a local educational app; mitigation is to treat the token as throwaway on logout and validate at startup.
- [Dev proxy does not exist in production builds] -> later deployment must point the frontend at the real API origin (env base URL). Buried in a future ops task, not this change.
- [Backend enforces no password rules] -> frontend keeps validation to non-empty to avoid contradicting the server.

## Migration Plan

Greenfield: no data migration. Rollback is reverting the `chatApp/` sources and the `vite.config.ts` proxy — the backend is untouched and remains runnable.