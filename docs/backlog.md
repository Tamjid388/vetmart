# VetMart — Build Backlog (solo)

**Source of truth:** `docs/srs.md` v0.5. This file is build order only.
**Roles:** `admin`, `staff` (default). Customers and Suppliers never log in.
**Verify after every epic:** `pnpm db:generate` then `pnpm exec tsc --noEmit` then `pnpm exec eslint .` then `pnpm test`.

- [ ] **E1 — Auth + role migration** (`docs/epics/E1-auth.md`)
- [ ] **E2 — Party masters** (`docs/epics/E2-parties.md`)
- [ ] **E3 — Catalog + inventory correctness** (`docs/epics/E3-catalog.md`)
- [ ] **E4 — POS Sale** (`docs/epics/E4-sale.md`, biggest — split into E4a/E4b if it drags past 2–3 sittings)
- [ ] **E5 — Payments + void wiring** (`docs/epics/E5-payments.md`)
- [ ] **E6 — Purchase / GRN module** (`docs/epics/E6-purchase.md`, biggest after E4 — split backend/frontend sittings if needed)
- [ ] **E7 — Admin user management** (`docs/epics/E7-users.md`, Settings-embedded staff creation via `POST /users`; public register kept as deprecated backup)
- [ ] **E8 — Mobile shell + mobile product list** (`docs/epics/E8-mobile-nav.md`, spec only, single file — E8a bottom tab bar per `docs/designs/Bottom navigation.png`, E8b product cards per `docs/designs/stockpage.png`; no code changes yet)
- [x] **E9 — Audit Trail, read-only observer, admin-only** (`docs/epics/E9-audit.md`, IMPLEMENTED 2026-09-21 — no new tables; timeline over existing rows via `GET /audits/*`)

Rules: finish in order E1 → E6. Do not start E4 without E1–E3 green. Do not go live on E4 without E5. Deferred for v1: split payments, per-line discounts, partial returns, purchase edit/partial void, reports costing choice (SRS GAP-1/3/4).
