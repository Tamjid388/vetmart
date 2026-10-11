# Client Gaps & Next Steps

> Generated from global frontend setup review – 2026-09-18

---

## 1. Auth Flow (High Priority)

### 1a. Login mutation — wire API call
- **File:** `src/features/auth/pages/LoginPage/LoginPage.tsx`
- **What:** Add `useMutation` calling `apiPost('/auth/login', { email, password })`, call `setAccessToken()`, `navigate('/dashboard')` on success, show error toast on failure.
- **Wire:** `Form` needs `onFinish`, button needs `htmlType="submit"`.

### 1b. Route guard — block unauthenticated access
- **File:** `src/router/router.tsx`
- **What:** Add `<RequireAuth>` wrapper around `AppLayout` children that reads `getAccessToken()` and redirects to `/auth/login` if absent.
- Create a new component `src/components/RequireAuth/RequireAuth.tsx`.

### 1c. Logout handler
- **File:** `src/layouts/appLayout/AppLayout.tsx`
- **What:** Wire the Logout menu item's `onClick` to call `setAccessToken(null)` + `queryClient.clear()` + `navigate('/auth/login')`.

---

## 2. Global Error & Notification (High Priority)

### 2a. Global query/mutation error toast
- **File:** `src/lib/queryClient/queryClient.ts`
- **What:** In `App.tsx` (or `queryClient.ts`), add `queryClient.getQueryCache().config.onError` and mutation cache `onError` that calls `message.error(getApiErrorMessage(error))`.
- Requires access to `useAppProps()` (antd's `App` context) — set up in `App.tsx`.

### 2b. 404 / Error routes
- **File:** `src/router/router.tsx`
- **What:** Add `errorElement` on the root route and a `path: '*'` catch-all for `NotFoundPage`.
- Create `src/features/auth/pages/NotFoundPage/NotFoundPage.tsx` (or a shared page).

---

## 3. Token Refresh Strategy (Medium Priority)

### 3a. Decide between silent refresh or redirect
- **Current:** `axios.ts` interceptor redirects on 401 — no refresh attempt.
- **Options:**
  - **A) Silent refresh:** Add `/auth/refresh` call in interceptor, retry failed request. Needs a refresh token (cookie or separate storage).
  - **B) Redirect only:** Keep current approach but add a request queue so in-flight requests don't silently fail.
- **File:** `src/lib/axios/axios.ts`
- Confirm with server: does backend use refresh tokens (`JWT_REFRESH_SECRET` in `.env.example`)?

---

## 4. DX Improvements (Medium Priority)

### 4a. `@` path alias
- **Files:** `vite.config.ts`, `tsconfig.app.json`
- **What:** Add `resolve.alias: { '@': '/src' }` and `paths: { "@/*": ["./src/*"] }` so imports become `@/lib/axios` instead of `../../../../lib/axios`.

### 4b. Global error boundary + suspense fallback
- **File:** Create `src/components/ErrorBoundary/ErrorBoundary.tsx`
- Wrap `<App />` in `main.tsx` with `<ErrorBoundary>`.
- Add `<Suspense fallback={<Spin />}>` around `<RouterProvider>`.

### 4c. Tailwind v4 + antd reset
- **File:** `src/index.css`
- **What:** Verify no CSS clashes between Tailwind's preflight and antd's component styles. May need selective resets.

---

## 5. Tooling Parity with Server (Low Priority)

### 5a. Prettier
- Add `.prettierrc.json` matching server config.
- Add `format` / `format:check` scripts.

### 5b. Vitest
- Add `vitest.config.ts` + initial test setup.
- Add `test` / `test:ui` scripts.

### 5c. Husky + lint-staged
- Server has `.husky/` — add same for client (or share root config).

---

## 6. Completed / Verified ✅

| Item | Status |
|---|---|
| TanStack Query + Devtools | ✅ Installed & wired in `App.tsx` |
| Axios instance | ✅ `src/lib/axios/axios.ts` — interceptors, typed helpers |
| API wrappers | ✅ `apiGet/Post/Put/Patch/Delete/Request` with `ApiResponse` unwrap |
| QueryClient | ✅ `src/lib/queryClient/queryClient.ts` — sane defaults |
| Antd theme | ✅ `src/theme/theme.ts` — full token config |
| Tailwind v4 | ✅ Vite plugin + `@import "tailwindcss"` in `index.css` |
| `vite-env.d.ts` | ✅ `VITE_API_URL` typed |
| `.env.example` | ✅ `VITE_API_URL=http://localhost:5000/api/v1` |
| TypeScript | ✅ `tsc -b` passes clean |
