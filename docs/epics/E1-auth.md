# E1 — Auth + Role Migration (cookie-based) — IMPLEMENTED 2026-09-18

> Notes on deviations: `UserService.login/register` still return `{ user, tokens }` internally — the controller needs the tokens to set HttpOnly cookies; the **response body** contains `{ user }` only. `refreshAccessToken` now rotates (returns `{ user, tokens }` fresh pair). Client `RequireAuth`/`RequireAdmin` guards added in `client/src/router/guards.tsx`; cost gating hides the Purchase column for staff (selling price kept for POS). Also fixed pre-existing `tsc` errors blocking `vite build` (`dashboard/utils/alerts.ts` now uses `ProductResponse` helpers; `CreateProductPage` handler widened to the form's union payload).

Depends on: nothing (build first)
SRS refs: Section 1, Section 4.1, Section 7 auth endpoints, Section 8 item 1

## Goal

`User` becomes staff auth-only (`admin` + `staff`, default `staff`) with HttpOnly cookie auth. No customer/vendor login, no localStorage tokens.

## Backend implementation (`server/`)

- [x] `prisma/schema/user.prisma`: `enum UserRole { admin staff }`, `User.role @default(staff)`. Keep `isDeleted`, timestamps as-is.
- [x] Data remap before enum migration (pick one, write choice here: **REMAP**): SQL `UPDATE users SET role='staff' WHERE role IN ('customer','vendor')` ~~or deactivate those rows (`isDeleted=true`)~~. Implemented in `server/prisma/migrations/0003_auth_roles_staff_only/migration.sql` (remap folded into the enum-rewrite `USING` clause — Postgres can't store `'staff'` before the new type exists and `ADD VALUE` can't run in Prisma's migration transaction). Then `pnpm db:generate` + `prisma migrate deploy` (deploy used because `migrate dev` is interactive-only in this environment).
- [x] `src/app/modules/users/user.constant.ts`: `USER_ROLES = { admin, staff }`.
- [x] `src/app/modules/users/user.validation.ts`: `update` schema role enum → `z.enum(['admin','staff'])`. Keep register with no role field (service forces `staff`). `refreshToken` body becomes empty (reads cookie).
- [x] `src/app/modules/users/user.service.ts`: `register` creates `role: 'staff'` (replaces `'customer'`). `login`/`register` return `{ user }` only (no tokens in body post-transition). `refreshAccessToken(refreshToken: string)` keeps its signature (controller passes the cookie value in). Keep `excludePassword`, `findFirst { isDeleted: false }` guards, generic `401` login message.
- [x] `src/app/modules/users/user.controller.ts`: `login`/`register` → `res.cookie('accessToken', access, { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: accessMs })` + same for `refreshToken`, respond `{ user }` only. `refreshToken` reads `req.cookies.refreshToken`, rotates (set new pair, respond `{}` or `{ user }`). Add `logout` → `res.clearCookie('accessToken', { path: '/' })` + `res.clearCookie('refreshToken', { path: '/' })`.
- [x] `src/app/modules/users/user.routes.ts`: add `POST /auth/logout` (public, clears cookies even without valid token). `POST /auth/refresh-token` takes no body.
- [x] `src/app/middlewares/auth.ts`: read `req.cookies.accessToken` first, fall back to `Authorization: Bearer` during one-release transition (log a warning on fallback use), then remove fallback. Same 401/403 behavior.
- [x] `src/app.ts`: already has `cookieParser()` + `cors { credentials: true }` — confirm `CORS_ORIGIN` is a specific origin (never `*`).
- [x] `src/app/modules/products/product.routes.ts`: replace `auth('admin','vendor')` with `auth('admin','staff')` on POST/PATCH/DELETE (temporary until E3 cost-hiding lands).
- [x] `prisma/seed.ts`: seeds two admins (`admin@vetmart.com`, `admin2@gmail.com` / `Admin123!`) + one staff (`staff@vetmart.com` / `Staff123!`) from a `seedUsers` array (append a row to add more). No customer/vendor seeds.
- [x] Verify (in `server/`): `pnpm db:generate`, `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm test`.

## Frontend implementation (`client/src/`)

- [x] `lib/axios/axios.ts`: delete `ACCESS_TOKEN_KEY/getAccessToken/setAccessToken` and the Bearer request interceptor. Keep `withCredentials: true` (already set). 401 handler: attempt one silent `POST /auth/refresh-token` retry, then redirect to `/auth/login` only if refresh fails (guard against loops on `/auth/*` itself).
- [x] `features/auth/`: add `api/auth.api.ts` (`login`, `register`, `refresh`, `logout`, `me`) via existing `apiPost/apiGet` helpers (no token handling). `types/`: role type → `'admin' | 'staff'`. Replace any token-presence checks with the `me` query (react-query `['me']`); logout mutation calls API then invalidates `['me']` and navigates to login.
- [x] `features/auth/pages/LoginPage/`: currently a static mock with no submit — wire AntD form `onFinish` to the login mutation, loading + error states, navigate to `/dashboard` on success. Store nothing in `localStorage`; delete the key if present.
- [x] `layouts/` + `router/router.tsx`: gate `/reports`, `/users`, cost columns on `me.role === 'admin'` (not on a stored token). Staff sees POS, customers, vendors, payments, products (qty only). No customer/vendor registration pages.
- [x] Remove any role select with `customer`/`vendor` options from forms and mocks.
- [x] Manual: staff login → `/reports` blocked, admin login → full menu; DevTools shows `accessToken`/`refreshToken` as HttpOnly, no token in `localStorage` or response bodies.

## Done when

- [x] Backend verify green (generate + typecheck + lint + test)
- [x] `vite build` passes in `client/`
- [x] Manual: login sets HttpOnly cookies; refresh works after access expiry; logout clears cookies; staff gets `403` on admin route; deleted user gets `401`; no `password` or token leaks in network responses or storage

## Deferred

- Refresh rotation reuse-detection, strict auth rate limits (see `server/docs/auth-security-review.md` — MEDIUM-1/3 still open; MEDIUM-2 body-tokens fixed by this epic)
- CSRF tokens for mutations (covered by `SameSite=Lax` for single-shop v1)
