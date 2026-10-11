# Auth Security Review — VetMart Server

> Date: 2026-09-12
> Scope: `src/app/middlewares/auth.ts`, `src/app/utils/jwtHelpers.ts`, `src/app/modules/users/*`, `src/app/modules/products/product.{routes,service}.ts`, `src/app.ts`, `src/app/config/index.ts`, `prisma/schema.prisma`
> Status: **Findings recorded — NOT yet implemented. No code changes made.**
> Update 2026-09-18: cookie-based auth decided (SRS v0.3, E1). When E1 lands, MEDIUM-2 (tokens in JSON body) is fixed; HIGH-2 scope changes (no vendor role — product write becomes `auth('admin','staff')` + cost-hiding instead of per-vendor ownership).

Core `auth()` logic is correct (Bearer check → verify → role gate, proper 401/403 split).
Issues below are in surrounding trust/lifecycle/authorization, ordered for later implementation.

## Verdict

* `auth.ts` itself: GOOD (fail-closed, correct status codes).
* Surrounding system: HAS VULNERABILITIES — 2 High, 5 Medium, 4 Low. Do not consider auth production-hardened until High items are fixed.

## Findings

### HIGH-1: Stale trust — deleted/demoted users stay valid until access-token expiry
- Location: `src/app/middlewares/auth.ts:35`, `src/app/utils/jwtHelpers.ts:19-20`
- Description: `req.user = decoded` trusts JWT `userId`+`role` with no DB lookup. Soft-deleted (`isDeleted=true`) or role-demoted user keeps old privileges for up to `JWT_ACCESS_EXPIRES_IN` (default `1h`).
- Note: `UserService.refreshAccessToken` *does* re-fetch user from DB (`user.service.ts:64-66`), but `auth()` does not.
- Planned fix:
  - [ ] Lookup active user in `auth()` (`findFirst { id, isDeleted: false }`) → 401 if missing.
  - [ ] Use fresh DB `role` for gate, not token claim (or add `tokenVersion`/`jti` on User, bump on role change/delete, reject mismatch).
  - [ ] Shorten access TTL to 5–15m (`JWT_ACCESS_EXPIRES_IN`).

### HIGH-2: No product ownership — any vendor can mutate any product
- Location: `src/app/modules/products/product.routes.ts:14-16`, `product.service.ts:49,55`, `prisma/schema.prisma:42-53`
- Description: `auth('admin','vendor')` gates create/patch/delete, but `Product` has no `vendorId/createdBy` and service never checks `req.user`. Any compromised vendor account = full catalog write.
- Planned fix:
  - [ ] Add `Product.vendorId → User.id` (+ migration).
  - [ ] Pass `req.user.userId/role` into `ProductService.create/updateById/softDelete`.
  - [ ] Enforce owner-or-admin; return 403 otherwise, 404 for soft-deleted.

### MEDIUM-1: Stateless refresh — no rotation / revocation / logout
- Location: `src/app/modules/users/user.service.ts:57-73`
- Description: Same refresh token reusable for full `7d`. No DB store, no reuse detection, no logout endpoint. Theft = 7-day persistence.
- Planned fix:
  - [ ] Rotate refresh on each use, store hash in DB (or Redis blocklist).
  - [ ] Add `POST /auth/logout` (invalidate) + reuse detection (invalidate chain on reuse).
  - [ ] Prefer `HttpOnly; Secure; SameSite=Strict` cookie for refresh.

### MEDIUM-2: Tokens in JSON body → XSS-stealable
- Location: `user.controller.ts:7-23`, `user.service.ts:36-39,50-53`
- Description: `register/login/refresh` return tokens in response body. If frontend stores in `localStorage`, any XSS = account takeover.
- Planned fix:
  - [ ] Send refresh via `HttpOnly` cookie; keep access short-lived in memory only.
  - [ ] Document frontend storage rule (never `localStorage` for refresh).

### MEDIUM-3: No brute-force protection on auth endpoints
- Location: `src/app.ts:30-41`
- Description: Only global `200 / 15min` limiter. `/auth/login`, `/auth/register`, `/auth/refresh-token` need stricter limits.
- Planned fix:
  - [ ] Per-route limiter e.g. `30 / 15min` on `/auth/*` + exponential backoff/lockout on login failures.

### MEDIUM-4: Weak secret / expiry validation + no token-type separation
- Location: `src/app/config/index.ts:11-14`, `src/app/utils/jwtHelpers.ts:5-12`
- Description: `z.string().min(1)` allows `JWT_ACCESS_SECRET=a` and allows `ACCESS_SECRET == REFRESH_SECRET`. No `tokenType` claim, no `algorithms` pin — a refresh token could be accepted as access token under misconfiguration.
- Planned fix:
  - [ ] `min(32)`, `refine(ACCESS !== REFRESH)`.
  - [ ] Add `tokenType: 'access' | 'refresh'` claim; enforce on verify.
  - [ ] Pin `algorithms: ['HS256']` in `jwt.verify`; validate `expiresIn` format.

### MEDIUM-5: Weak password policy + unbounded length (CPU DoS)
- Location: `src/app/modules/users/user.validation.ts:6`, `src/app/utils/password.ts`
- Description: `min(6)` only, no max. `bcryptjs` truncates at 72 bytes; very long inputs waste CPU.
- Planned fix:
  - [ ] `password: z.string().min(8).max(72)` (register + update + login max).
  - [ ] Optional complexity / breach-list check later.

### LOW-1: Bearer parsing brittle on extra whitespace
- Location: `src/app/middlewares/auth.ts:25`
- Description: `header.split(' ')[1]` yields `''`/undefined on `Bearer  <token>`; currently still fails-closed to 401 (OK) but fragile.
- Planned fix:
  - [ ] `const token = header.slice(7).trim(); if (!token) → 401`.

### LOW-2: Role claim not whitelisted
- Location: `src/app/middlewares/auth.ts:26-36`, `jwtHelpers.ts:5-8` (`role: string` vs `TUserRole`)
- Description: Unknown `role` string currently fails-closed via `includes` → 403 (good), but should fail explicitly.
- Planned fix:
  - [ ] `if (!Object.values(USER_ROLES).includes(decoded.role)) → 403/401`.

### LOW-3: `req.user!` non-null assertion in controllers
- Location: `src/app/modules/users/user.controller.ts:35`
- Description: Crashes with TypeError if route ever forgets `auth()`.
- Planned fix:
  - [ ] Guard: `if (!req.user) return next(new AppError(401, ...))` or typed `AuthenticatedRequest`.

### LOW-4: User-enumeration oracle on `GET /me` vs other routes
- Location: `user.service.ts:18-24`
- Description: Deleted user gets `404 User not found` on authenticated routes vs `401` for bad token. Acceptable; just noted. Login correctly returns generic `401 Invalid email or password` — keep that.

## What was explicitly GOOD (do not regress)

- `auth()` fail-closed: missing/malformed header → 401, wrong role → 403.
- `register` forces `role: 'customer'` — no self-assign admin (mass-assignment safe).
- `login` generic error message — no enumeration.
- `refreshAccessToken` checks `isDeleted` + re-issues with fresh DB role.
- `getAll` strips `password` even via `?fields=`; `excludePassword` on all user responses.
- `helmet`, `cors` env-gated, global rate limit, `express.json({ limit: '1mb' })` present.

## Implementation order (when approved)

1. HIGH-1 (DB-backed `auth()` + tokenVersion + 5–15m TTL).
2. HIGH-2 (Product.vendorId + owner-or-admin).
3. MEDIUM-1 + MEDIUM-2 (refresh rotation + HttpOnly cookies + logout).
4. MEDIUM-3 (strict auth rate limits).
5. MEDIUM-4 + MEDIUM-5 + LOW items (validation/hardening batch).
