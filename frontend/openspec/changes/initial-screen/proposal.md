## Why

The chat app has no frontend yet — `chatApp/` is still the Vite starter template, while the backend already exposes a complete auth + messaging API. Users have no way to enter the application. This change establishes the entry point: a login/registration screen that establishes a session, so the chat itself can be built on top next.

## What Changes

- Replace the Vite starter screen in `chatApp/` with an auth entry screen.
- Add a login form (`POST /api/v1/login`) and a registration form (`POST /api/v1/signup`) against the existing backend.
- Persist the returned JWT and username in `localStorage` so a reload keeps the session.
- Add a minimal authenticated view ("app shell"): on login, fetch `GET /api/v1/data` with the token and render the channel list as a stub with an empty message pane — proof that the session works and a foundation for the chat UI.
- Add a logout action that clears the session and returns to the auth screen.
- Add a Vite dev proxy from `/api` to the backend (`http://localhost:5001`) so the frontend uses relative URLs.

## Capabilities

### New Capabilities
- `user-auth`: The entry screen behavior — login and registration forms, error handling, token persistence, session validation, logout, and the initial authenticated view showing the server's channel list.

### Modified Capabilities
- None. The parent `openspec/` has no specs yet.

## Impact

- **Code**: `frontend/chatApp/src/App.tsx` rewritten; new `frontend/chatApp/src/api/auth.ts`, `src/pages/LoginPage.tsx`, `src/pages/AppShell.tsx`; replaced `index.css`/`App.css`; `frontend/chatApp/vite.config.ts` gains a proxy.
- **Dependencies**: none added (`fetch`, `localStorage` only). Starter assets (`hero.png`, `react.svg`, `vite.svg`) become unused.
- **Backend API**: consumed as-is; no backend changes. Relevant endpoints: `POST /api/v1/login` (200/401), `POST /api/v1/signup` (201/409), `GET /api/v1/data` (Bearer, 200/401).
- **Ops**: requires the backend running on its script default port 3000 (its README's 5001 is only what the `-p` flag selects).