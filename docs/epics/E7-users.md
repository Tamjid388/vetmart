# E7 — Admin User Management (staff creation inside Settings) — IMPLEMENTED 2026-09-21

Depends on: E1
SRS refs: Section 1 (roles + "accounts are created by an existing admin (or seeded)"), Section 4.1 (User model), Section 7 (`/users` endpoints), Rules 1–2 (admin-only user management, no cost/profit leak to staff)

## Goal

Close the staff-onboarding hole: an admin creates staff/admin accounts from inside the app. No public signup page. `POST /auth/register` stays as-is (deprecated dev-backup, never called from UI); the canonical path becomes `POST /users` (admin-only, no cookie overwrite).

## Decisions (locked 2026-09-21)

- Public `POST /auth/register` is KEPT (not removed). Frontend never calls it. Marked `@deprecated` in code + docs.
- Admin can create both roles: `staff` (default) + `admin` via role dropdown.
- No separate `/users` page and no sidebar entry. User management lives inside `SettingsPage` as an admin-only "Staff Management" section.

## Backend implementation (`server/`)

- [x] `src/app/modules/users/user.validation.ts`: add `createUser` schema — `{ email (email), password (min 6), name? (min 1 optional), role: z.enum(['admin','staff']).default('staff') }` with `.strict()`. Keep existing `register`/`login`/`update` schemas untouched.
- [x] `src/app/modules/users/user.interface.ts`: add `ICreateUserPayload { email: string; password: string; name?: string; role?: TUserRole }`.
- [x] `src/app/modules/users/user.service.ts`: add `createUser(payload: ICreateUserPayload): Promise<TSafeUser>` — explicit duplicate-email check (`409 Conflict`, message `Email already in use`) before create (do not rely on raw P2002); `hashPassword`; `prisma.user.create({ email, password, name?, role: payload.role ?? 'staff' })`; return `excludePassword(user)`. No JWT signing, no tokens returned (unlike `register` which returns `{ user, tokens }`).
- [x] `src/app/modules/users/user.controller.ts`: add `createUser` handler — `201 Created`, message `User created successfully`, body `{ user }` only. Must NOT call `setAuthCookies` (admin session must survive staff creation — this is the key difference from `register`).
- [x] `src/app/modules/users/user.routes.ts`: add `userRouter.post('/', auth('admin'), validateRequest(UserValidation.createUser), UserController.createUser)` — i.e. `POST /api/v1/users` admin-only. Keep `POST /auth/register` route untouched. Export `createUser` from `UserController`/`UserService` maps.
- [x] Safety guard: admin cannot soft-delete their own account (`DELETE /users/:id` with `id === req.user.userId` → `400`). Self-demote (`PATCH /:id` role change on self) → `400`. Prevents accidental lockout. Last-admin protection (block deleting/demoting the final admin) is deferred, not in this epic.
- [x] Mark `register` service/controller/api as `@deprecated` via code comment: "Deprecated — dev-backup only. Use POST /users (admin)."
- [x] Verify in `server/`: `pnpm db:generate`, `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm test` (add service test: create staff default role, create admin, duplicate 409, no tokens in return).

## Frontend implementation (`client/src/`)

No new routes, no sidebar menu item. All work is a new `features/users/` data module embedded in Settings.

- [x] `features/users/types/user.types.ts` (+ `index.ts`): `CreateUserPayload { email: string; password: string; name?: string; role: UserRole }`, `UpdateUserPayload { name?; role?; password? }`, `UserListQueryParams`, reuse `AuthUser` from `features/auth` for rows.
- [x] `features/users/api/users.api.ts` (+ `index.ts`): `BASE='/users'`; `getUsers(params)`, `createUser(payload)`, `updateUser(id, payload)`, `deleteUser(id)` (soft delete) via existing `apiGet/apiPost/apiPatch/apiDelete` helpers with `withCredentials`.
- [x] `features/users/hooks/`: `useUsers(params)` key `['users', params]` with `keepPreviousData` (products-page pattern); `useUserMutations` (`createUser`/`updateUser`/`deleteUser` invalidate `['users']`).
- [x] `features/users/schemas/user.schema.ts` (+ `index.ts`): zod create schema (email, password min 6, name optional, role enum), edit schema (name/role/password optional, min 1 field).
- [x] `features/users/components/UserTable/` + `CreateUserModal/` (or `UserForm/`): AntD Table (name, email, role tag, created date) + search by email/name + role filter; Create modal with email + password + name + role Select (Staff default, Admin option); edit-role inline or modal; deactivate button with confirm (`Deactivate` copy, not `Delete`); map `409` to "Email already in use" and `400` self-guard to readable message.
- [x] `features/settings/pages/SettingsPage/SettingsPage.tsx`: keep existing content for all roles; render `<StaffManagementSection />` only when `useMe().isAdmin` is true. Staff sees no user-management UI (SRS Rule 1).
- [x] `features/auth/api/auth.api.ts`: mark exported `register()` as `@deprecated` (comment only, do not delete — keeps the dev-backup callable for scripts while signalling UI must not use it).
- [x] `vite build` passes in `client/`.

## Done when

- [x] Backend verify green (generate + typecheck + lint + test incl. new createUser tests)
- [x] `vite build` passes
- [ ] Manual: admin login → Settings → create staff (default) + create admin → admin session intact (no logout, `me` still admin); new accounts can log in; duplicate email → friendly error; staff login → Settings shows no Staff Management section; direct `POST /users` as staff → `403`; admin self-delete → `400`

## Deferred

- Last-admin protection (block deleting/demoting the final remaining admin)
- Password reset / force-change-on-first-login flow
- Removing `POST /auth/register` entirely (kept deliberately as dev-backup in this epic)
- Separate `/users` page + sidebar entry (deliberately not built — Settings-embedded chosen)
- Audit log of who created/deactivated whom (`createdBy` on User)
