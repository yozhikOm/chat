## 1. Build Foundation

- [ ] 1.1 Add a dev proxy to `chatApp/vite.config.ts`: `server.proxy: { '/api': 'http://localhost:5001' }` and verify with `cd chatApp && npx vite` that the server starts and a `GET /api/v1/login` (curl or browser) returns a 400 response (proxying is working)
- [ ] 1.2 Replace `chatApp/src/index.css` and `chatApp/src/App.css` with a minimal dark-theme baseline (CSS variables for background, text, border, accent) and verify `npm run build` compiles cleanly
- [ ] 1.3 Create `chatApp/src/api/auth.ts` exporting `login(username, password)`, `signup(username, password)`, and `fetchData(token)` using native `fetch`; define an `AuthError` type carrying `statusCode`; verify `npx tsc -b` compiles and the module exports resolve

## 2. Entry Screen

- [ ] 2.1 Create `chatApp/src/pages/LoginPage.tsx`: a tabbed form (Вход / Регистрация) with username and password inputs, a submit button, a loading state, and a single error message line; on submit call `login` or `signup` from `api/auth.ts` and on success invoke an `onAuth(token, username)` callback with the result; verify `npx tsc -b` compiles with no errors
- [ ] 2.2 Rewrite `chatApp/src/App.tsx` to read `token` and `username` from `localStorage` on mount; render `LoginPage` when the token is absent; on `onAuth` callback persist token and username then re-render; verify `npm run build` succeeds and `npm run dev` shows the login screen with two working tabs (Вход / Регистрация) and no runtime errors in the browser console

## 3. Authenticated View

- [ ] 3.1 Create `chatApp/src/pages/AppShell.tsx`: on mount call `fetchData(token)` with the token prop; on 401 clear localStorage and invoke an `onLogout()` callback; on network error show a Russian message without clearing storage; render a header with the username and a Выйти button, a channel list from the fetched `channels` array, the current channel highlighted via `currentChannelId`, and an empty message-pane stub; verify `npx tsc -b` compiles cleanly
- [ ] 3.2 Update `chatApp/src/App.tsx` to render `AppShell` when a token is present, passing `onLogout` that clears localStorage and re-renders the entry screen; verify `npm run build` succeeds and the full flow works end-to-end: login as `admin`/`admin` shows the channel list, reload keeps the session, logout returns to the entry screen

## 4. Polish and Hardening

- [ ] 4.1 Add non-empty validation to the LoginPage form fields and ensure the submit button is disabled while loading; verify that submitting with empty fields does not hit the server and shows no blank error states
- [ ] 4.2 Verify the full spec holds: (a) first visit shows the entry screen, (b) successful login enters the authenticated view, (c) invalid credentials show the Russian error message, (d) a 401 from AppShell clears the session and returns to the entry screen, (e) logout clears the session
- [ ] 4.3 Remove unused Vite starter content from `App.tsx` (hero images, react/vite logos, documentation links) and delete the associated unused imports; verify `npm run build` and `npm run lint` both pass cleanly