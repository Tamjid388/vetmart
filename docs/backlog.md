# VetMart — Build Backlog (solo)

**Source of truth:** `docs/srs.md` v0.6 (2026-11-03). This file is build order only.
**Roles:** `admin`, `staff` (default). Customers and Suppliers never log in.
**Verify after every epic:** `pnpm db:generate` then `pnpm exec tsc --noEmit` then `pnpm exec eslint .` then `pnpm test`.

- [x] **E1 — Auth + role migration** (`docs/epics/E1-auth.md`, IMPLEMENTED 2026-09-18)
- [x] **E2 — Party masters** (`docs/epics/E2-parties.md`, IMPLEMENTED)
- [x] **E3 — Catalog + inventory correctness** (`docs/epics/E3-catalog.md`, IMPLEMENTED)
- [x] **E4 — POS Sale** (`docs/epics/E4-sale.md`, IMPLEMENTED 2026-09-19)
- [x] **E4b — Cash-customer sale + customer history** (`docs/epics/E4b-cash-customer-sale.md`, IMPLEMENTED 2026-10-11 — `SaleType`, nullable `customerId`, history tabs)
- [x] **E5 — Payments + void wiring** (`docs/epics/E5-payments.md`, IMPLEMENTED 2026-09-19)
- [x] **E6 — Purchase / GRN module** (`docs/epics/E6-purchase.md`, IMPLEMENTED 2026-09-19 + vendor payments Section 4.14)
- [x] **E7 — Admin user management** (`docs/epics/E7-users.md`, IMPLEMENTED 2026-09-21, Settings-embedded staff creation via `POST /users`)
- [ ] **E8 — Mobile shell + mobile product list** (`docs/epics/E8-mobile-nav.md`, spec only, single file — E8a bottom tab bar per `docs/designs/Bottom navigation.png`, E8b product cards per `docs/designs/stockpage.png`; no code changes yet)
- [x] **E9 — Audit Trail, read-only observer, admin-only** (`docs/epics/E9-audit.md`, IMPLEMENTED 2026-09-21 — no new tables; timeline over existing rows via `GET /audits/*`)
- [x] **Dashboard** (IMPLEMENTED 2026-10-19 — `GET /dashboard`, Section 4.17, FIFO-actual profit/stock value)
- [x] **Reports Console** (IMPLEMENTED 2026-10-19 — `GET /reports/*` 9 endpoints, Section 4.18, FIFO-actual costing resolves GAP-1)
- [x] **Customer ledger filters** (IMPLEMENTED 2026-10-31 — `GET /sales` gains `customerName`/`area`/date-range filters, Rule 26; sales-only purchase list, no new model)

Rules: finish in order E1 → E6. Do not start E4 without E1–E3 green. Do not go live on E4 without E5. Deferred for v1: split payments, per-line discounts, partial returns, purchase edit/partial void (SRS GAP-3/4).
