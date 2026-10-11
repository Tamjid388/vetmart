# E9 — Audit Trail (read-only observer, admin-only) — IMPLEMENTED 2026-09-21

Depends on: E1 (roles/auth), E2–E6 (the tables being observed: users, masters, stock, sales, payments, purchases)
SRS refs: Section 1 (admin access incl. Audit Trail), Section 4.15 (event sources, shape, endpoints, exclusions), Rules 1 (admin-only audits module) + 23 (observe-only, display-only severity), Section 7 (`/audits` endpoints), GAP-5 (excluded dimensions)

## Goal

Give the owner one admin-only screen answering "who did what and when" — sales, purchases, voids, payment collections, stock movements, user/master adds and removals — without adding any table, column, write path, or business logic. The module observes existing rows only.

## Decisions (locked 2026-09-21)

- No `AuditLog` table and no schema migration. Every event derives from already-stored columns (`createdAt` / `updatedAt` / `paidAt` / `isDeleted` / `StockLedger.type`).
- Read-only end to end: backend exposes GET only; frontend has no forms or mutations.
- Admin-only on both layers: `auth('admin')` on all `/audits` routes (lot costs and void trails must never reach staff, SRS Rule 1); `/audits` route behind `RequireAdmin` + sidebar entry with `ADMIN_ONLY`.
- `severity` is a display-only tag mapping (Rule 23), never business logic.
- Dimensions with no stored source (login history, approvals, IP/device, export history, master before/after, void/change reasons) are excluded from the UI, not fabricated (GAP-5).

## Backend implementation (`server/`)

- [x] `src/app/modules/audits/audit.constant.ts`: `AUDIT_MODULES` (sale, purchase, payment, stock, user, customer, supplier, product), `AUDIT_ACTIONS` (created, voided, collected, movement, deactivated), `AUDIT_STOCK_TYPES` (mirrors `StockLedgerType` enum), per-module searchable fields (each source module's own list), `toAuditSeverity` display mapping.
- [x] `src/app/modules/audits/audit.interface.ts`: `TAuditModule`, `TAuditAction`, `TAuditSeverity`, `IAuditActor`, `IAuditEvent` (`id = "<module>:<action>:<recordId>"`, `actor` null when the source stores none), `IAuditEventFilters`, `IAuditOverview`.
- [x] `src/app/modules/audits/audit.service.ts`: `getOverview` (counts/sums via `count`/`aggregate`/`groupBy` with optional `dateFrom`/`dateTo`, incl. top-5 actors merged from `soldBy`/`receivedBy`/`collectedBy`), `getEvents` (per-source collectors with shared filters, merged + sorted in memory, manual slice pagination capped at 100/page), `getEventDetail` (underlying record with existing relations; unknown module → `400`, missing row → `404`). `stockBefore = stockAfter - qtyDelta` (both stored columns). No `password` ever selected.
- [x] `src/app/modules/audits/audit.controller.ts` + `audit.routes.ts`: `GET /overview`, `GET /events`, `GET /events/:module/:id` — all `auth('admin')`, no POST/PATCH/DELETE.
- [x] `src/app/routes/index.ts`: mount `{ path: '/audits', route: AuditRoutes }` (additive only, existing mounts untouched).
- [x] `src/app/modules/audits/audit.routes.test.ts`: unauthenticated `GET` on all three routes → `401` (mount + gate proof).
- [x] Verify in `server/`: `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm exec prettier --check`, `pnpm test` green (22 tests incl. 3 new audit route tests). No migration needed (`db:generate` output unchanged — no schema edit).

## Frontend implementation (`client/src/`)

- [x] `features/audits/` data module mirroring `features/payments/` conventions: `types/audit.types.ts`, `data/audit.constants.ts` (`PAGE_SIZE`, `DEFAULT_AUDIT_FILTERS`, module/action options), `api/audit.api.ts` (`BASE='/audits'`; `getAuditOverview`, `getAuditEvents`, `getAuditEventDetail` via `apiGet`/`apiGetWithMeta`), `hooks/` (`useAuditOverview`, `useAuditEvents`, `useAuditEventDetail` on `['audit-*']` keys), `utils/format.ts` (`formatTaka`, `formatDateTime`, `formatDate`) + `utils/auditUi.ts` (tag colors).
- [x] `features/audits/components/`: `AuditOverviewCards/` (sales/purchases/payments/stock+users cards + top-actors table), `AuditFilters/` (search, module, action, from/to dates + reset), `AuditTable/` (desktop) + `AuditCardList/` (mobile via `useIsMobile`), `AuditDetailDrawer/` (event header tags, stored-fields descriptions, stock before→after alert, sale/purchase line items, record note).
- [x] `features/audits/pages/AuditsPage/`: overview on top, `Card` titled `Activity log (কার্যক্রম)` with filters + table/cards, drawer on View. No create/edit routes.
- [x] `router/router.tsx`: additive `{ path: 'audits', element: <RequireAdmin />, ... }` (existing routes untouched).
- [x] `layouts/appLayout/menuItems.tsx`: additive `{ key: '/audits', label: 'অডিট (Audit)', icon: <AuditOutlined />, roles: ADMIN_ONLY }` + `pageTitles` entry (auto-flows into desktop Sider, mobile More sheet, and header title; staff filtered out by `getAppMenuItems`).
- [x] `tsc -b`, `eslint`, and `vite build` pass in `client/`.

## Done when

- [x] Backend verify green (typecheck + lint + format + test incl. new audit route tests, no migration)
- [x] `vite build` passes
- [ ] Manual: admin login → Audit shows overview + timeline, filters narrow results, View opens detail with correct actor/time; staff login → no Audit menu, direct `/audits` URL redirects to dashboard, direct API hit → `403`

## Deferred

- GAP-5 dimensions: login/security history, approval workflow, IP/device, export/download history, field-level before/after for master edits, void/change reasons (all need new storage + SRS spec first)
- `ADJUSTMENT` ledger writes have no producer yet (enum listed, unwritten by current services)
- CSV export of the audit timeline
- Last-actor attribution for master/user rows (sources store no `createdBy`)
