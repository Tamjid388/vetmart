# Customer Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a navbar Ledger page listing every customer purchase (Sale rows) filterable by customer Name, date range, and Area.

**Architecture:** Extend `GET /sales` with relation + range filters (no new backend module); add a new frontend `features/ledgers` page reusing Sale table + expandable items pattern over the extended sales API.

**Tech Stack:** Express + Prisma + Zod (server, `vitest`/`supertest`); React + AntD + TanStack Query + React Router (client, `tsc -b` verification).

**Spec:** `docs/superpowers/specs/2026-10-31-customer-ledger-design.md`

## Global Constraints

- Single permission source stays `appMenuItems` + `roles` in `client/src/layouts/appLayout/menuItems.tsx`.
- `Customer.area` stored lowercase via `toStoredArea`/`normalizeArea` in `server/src/app/shared/normalize.ts`; Area filter must normalize identically.
- Use indexed fields `Sale.saleDate`, `Sale.customerId` + `customer` relation; no new DB index in v1.
- Never use worktrees; edit directly in local codebase, user pushes manually.
- Keep tech terms `Sale`, `saleDate`, `dateFrom`, `dateTo`, `grandTotal`, `paidAmount`, `dueAmount` in English.
- New route `/customer-ledger` lives under `RequireAuth` + `AppLayout` children; visible to admin + staff; mobile via MoreSheet, bottom tabs unchanged.

## Review Focus

- `dateFrom` after `dateTo` must be rejected with 400, not silently swapped — test in Task 1.
- `area=Mirpur` vs stored `mirpur` must match (normalization) — test in Task 1.
- `customerName` with Prisma special chars / empty string must not throw — test in Task 1.
- CASH sales have `customerId = null` and must still appear when no customer filter is set, and must be excluded (not crash) when a customer filter is set — test in Task 1.
- First load with no dates sends last-30-days from frontend; unbounded backend range must still paginate and never return unbounded rows — test in Task 2 (query-string assertion).

---

## File Structure

- Backend (modify): `server/src/app/modules/sales/sale.service.ts` (new `buildLedgerSaleWhere` + `getAll` extension + `saleInclude` adds `customer.area`), `server/src/app/modules/sales/sale.interface.ts` (`TSaleCustomer` adds `area`), `server/src/app/modules/sales/sale.logic.ts` (pure date-boundary helper if needed).
- Backend (create test): `server/src/app/modules/sales/sale.ledger.test.ts` (pure where-builder + date validation tests, no DB).
- Frontend shared (modify): `client/src/features/sales/types/sale.types.ts` (`SaleCustomer` + `SaleListQueryParams`), `client/src/features/sales/api/sale.api.ts` (`getSales` passes new params).
- Frontend feature (create): `client/src/features/ledgers/` — `types/ledger.types.ts`, `api/ledger.api.ts`, `hooks/useCustomerLedger/useCustomerLedger.ts` + `index.ts`, `components/LedgerFilters/LedgerFilters.tsx` + `index.ts`, `components/LedgerTable/LedgerTable.tsx` + `index.ts`, `components/LedgerCardList/LedgerCardList.tsx` + `index.ts`, `pages/CustomerLedgerPage/CustomerLedgerPage.tsx` + `index.ts`, `components/index.ts`, `hooks/index.ts`, `pages/index.ts`, `index.ts`.
- Nav (modify): `client/src/layouts/appLayout/menuItems.tsx` (nav item + `ROUTE_GROUP_MAP` + `pageTitles`), `client/src/router/router.tsx` (route).

---

### Task 1: Backend — `GET /sales` ledger filters

**Files:**
- Modify: `server/src/app/modules/sales/sale.service.ts`
- Modify: `server/src/app/modules/sales/sale.interface.ts`
- Create: `server/src/app/modules/sales/sale.ledger.test.ts`
- Test: `server/src/app/modules/sales/sale.ledger.test.ts`

**Interfaces:**
- Consumes: `normalizeArea` from `server/src/app/shared/normalize.ts`, `IQueryParams` from `server/src/app/shared/QueryBuilder.ts`.
- Produces: `buildLedgerSaleWhere(query: { customerName?: string; area?: string; dateFrom?: string; dateTo?: string }) -> Prisma.SaleWhereInput` (exported for test); extended `SaleService.getAll` accepting `customerName`, `area`, `dateFrom`, `dateTo`; `TSaleCustomer` includes `area?: string | null`.

- [ ] **Step 1: Write the failing test**

```ts
// server/src/app/modules/sales/sale.ledger.test.ts
import { describe, expect, it } from 'vitest';
import { buildLedgerSaleWhere } from './sale.service.js';

describe('buildLedgerSaleWhere', () => {
  it('normalizes area Mirpur to mirpur', () => {
    expect(buildLedgerSaleWhere({ area: 'Mirpur' })).toEqual({ customer: { area: 'mirpur' } });
  });
  it('maps customerName to insensitive contains', () => {
    expect(buildLedgerSaleWhere({ customerName: 'Rahim' })).toEqual({
      customer: { name: { contains: 'Rahim', mode: 'insensitive' } },
    });
  });
  it('maps date range to saleDate gte/lte day boundaries', () => {
    const where = buildLedgerSaleWhere({ dateFrom: '2026-10-01', dateTo: '2026-10-31' }) as any;
    expect(where.saleDate.gte).toBeInstanceOf(Date);
    expect(where.saleDate.lte).toBeInstanceOf(Date);
  });
  it('throws 400 when dateFrom is after dateTo', () => {
    expect(() => buildLedgerSaleWhere({ dateFrom: '2026-10-31', dateTo: '2026-10-01' })).toThrow();
  });
  it('empty customerName does not add customer filter (CASH null-safe)', () => {
    expect(buildLedgerSaleWhere({ customerName: '   ' })).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && pnpm vitest run src/app/modules/sales/sale.ledger.test.ts`
Expected: FAIL with "buildLedgerSaleWhere is not exported / not defined"

- [ ] **Step 3: Implement `buildLedgerSaleWhere` + wire into `getAll` in `server/src/app/modules/sales/sale.service.ts`**

Signature: `export const buildLedgerSaleWhere = (query: { customerName?: string; area?: string; dateFrom?: string; dateTo?: string }): PrismaTypes.SaleWhereInput`. Rules: trim `customerName`, ignore when empty; `customer: { name: { contains, mode: 'insensitive' } }`; `area` via `normalizeArea`, ignore when empty after normalize; `dateFrom` → `saleDate.gte = start-of-day`, `dateTo` → `saleDate.lte = end-of-day` with plain `Date` (invalid → `AppError 400`); `dateFrom > dateTo` → `AppError 400`. In `getAll`: read `query['customerName']`, `query['area']`, `query['dateFrom']`, `query['dateTo']` as strings, merge `buildLedgerSaleWhere(...)` output with existing `qbQuery` — since relation filters can't go through `QueryBuilder.filter()`, apply by passing a custom `where` override: keep existing `qbQuery` for flat fields, then spread relation/date where into the Prisma `findMany`/`count` `where` alongside `qbQuery` (base `isDeleted: false` preserved). Extend `saleInclude.customer.select` with `area: true`.

- [ ] **Step 4: Extend `TSaleCustomer` in `server/src/app/modules/sales/sale.interface.ts`**

Change `export type TSaleCustomer = Pick<Customer, 'id' | 'name' | 'phone'>` to `Pick<Customer, 'id' | 'name' | 'phone' | 'area'>`. No logic change.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && pnpm vitest run src/app/modules/sales/sale.ledger.test.ts`
Expected: PASS (5 tests). Also run: `cd server && pnpm vitest run src/app/modules/sales/sale.logic.test.ts src/app/modules/sales/sale.validation.test.ts`
Expected: PASS (no regressions).

- [ ] **Step 6: Commit**

```bash
git add server/src/app/modules/sales/sale.service.ts server/src/app/modules/sales/sale.interface.ts server/src/app/modules/sales/sale.ledger.test.ts
git commit -m "feat(server): ledger filters on GET /sales (customerName, area, date range)"
```

### Task 2: Frontend shared — sales types + API pass-through

**Files:**
- Modify: `client/src/features/sales/types/sale.types.ts`
- Modify: `client/src/features/sales/api/sale.api.ts`
- Test: manual query-string check via `tsc` (client has no unit runner)

**Interfaces:**
- Consumes: Task 1 `GET /sales?customerName=&area=&dateFrom=&dateTo=` contract.
- Produces: `SaleCustomer` with `area?: string | null`; `SaleListQueryParams` with `customerName?`, `area?`, `dateFrom?`, `dateTo?`; `getSales()` forwards them.

- [ ] **Step 1: Write the failing type check (add fields, verify old caller still compiles)**

In `client/src/features/sales/types/sale.types.ts`: extend `SaleCustomer` with `area?: string | null` and `SaleListQueryParams` with `customerName?: string; area?: string; dateFrom?: string; dateTo?: string`. In `client/src/features/sales/api/sale.api.ts`: forward the four params into `query` (same `if (params?.x) query.x = params.x` pattern). No test file; the check is the compiler.

- [ ] **Step 2: Run type check to verify it fails before fix (baseline)**

Run: `cd client && npx tsc -b`
Expected before edit: PASS (baseline). After edit, any consumer mismatch (e.g. ledger hook) fails until Task 3 exists — this is expected and Task 3 resolves it.

- [ ] **Step 3: Implement the type + API changes**

Exact edits: `SaleCustomer = { id, name, phone, area?: string | null }`; `SaleListQueryParams` add the four optional strings; `getSales` adds four `if` lines mirroring `customerId`.

- [ ] **Step 4: Run type check to verify it passes**

Run: `cd client && npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/features/sales/types/sale.types.ts client/src/features/sales/api/sale.api.ts
git commit -m "feat(client): sales types+api carry ledger filters"
```

### Task 3: Frontend — Ledger feature (filters + table/cards + page)

**Files:**
- Create: `client/src/features/ledgers/types/ledger.types.ts`
- Create: `client/src/features/ledgers/api/ledger.api.ts`
- Create: `client/src/features/ledgers/hooks/useCustomerLedger/useCustomerLedger.ts` + `index.ts`
- Create: `client/src/features/ledgers/components/LedgerFilters/LedgerFilters.tsx` + `index.ts`
- Create: `client/src/features/ledgers/components/LedgerTable/LedgerTable.tsx` + `index.ts`
- Create: `client/src/features/ledgers/components/LedgerCardList/LedgerCardList.tsx` + `index.ts`
- Create: `client/src/features/ledgers/pages/CustomerLedgerPage/CustomerLedgerPage.tsx` + `index.ts`
- Create: barrel `index.ts` files for `types`, `api`, `hooks`, `components`, `pages`, `features/ledgers`
- Test: `tsc -b` + manual UI check (no client runner)

**Interfaces:**
- Consumes: `getSales` + `SaleListQueryParams` (Task 2), `useCustomerAreas` from `features/customers`, `PAGE_SIZE`-style constant local to feature, AntD `RangePicker`, `Table` expand pattern from `CustomerHistory.tsx`.
- Produces: `useCustomerLedger(params) -> { data, total, isLoading }`; `<LedgerFilters value onChange />`; `<LedgerTable data page pageSize total isLoading onPageChange />`; default-exported `CustomerLedgerPage` reading `?customerName` initial from URL optional.

- [ ] **Step 1: Create types + API wrapper (failing until wired)**

`ledger.types.ts`: `export type LedgerFiltersValue = { name: string; area?: string; dateFrom?: string; dateTo?: string }`. `ledger/api/ledger.api.ts`: `export async function getCustomerLedger(params: SaleListQueryParams)` thin wrapper calling `getSales(params)` (keeps ledger naming while reusing sales backend).

- [ ] **Step 2: Create `useCustomerLedger` hook**

File `hooks/useCustomerLedger/useCustomerLedger.ts`: `useQuery({ queryKey: ['ledgers','customer', params], queryFn: () => getCustomerLedger(params) })`, return `{ data: data?.data ?? [], total: data?.meta?.total ?? 0, isLoading, error }` mirroring `useSales`.

- [ ] **Step 3: Create `LedgerFilters`**

Props `{ value: LedgerFiltersValue; onChange: (next) => void }`. Controls: Name `Input` (allowClear, `SearchOutlined`, placeholder `Search customer name...`), Area `Select` (allowClear, placeholder `All areas`, options from `useCustomerAreas().areas`), date `RangePicker` (value maps to `dateFrom`/`dateTo` ISO `YYYY-MM-DD`). Changing any control calls `onChange` patched object. Follows `CustomerFilters.tsx` + `SaleFilters.tsx` layout (`flex flex-wrap gap-3`).

- [ ] **Step 4: Create `LedgerTable` (desktop) + `LedgerCardList` (mobile)**

`LedgerTable` columns: Date (`saleDate` via sales `formatDateTime`), Customer (name + phone + area tag), Invoice (`invoiceNo`), Items (count), Bill (`grandTotal` right-aligned), Paid (`paidAmount`), Due (`dueAmount` red when > 0), Status (`paymentStatus` Tag). `expandable.expandedRowRender` renders items mini-table (product name, qty, sellingPrice, lineTotal) like `CustomerHistory.tsx itemColumns`. Pagination: `{ current: page, pageSize, total, showTotal }`. `LedgerCardList`: one `Card` per sale with same fields stacked + expandable items summary line (no AntD Table to stay mobile-light), pagination `Pagination` component.

- [ ] **Step 5: Create `CustomerLedgerPage`**

State: `filters: LedgerFiltersValue` (`{ name: '' }`), `page`. Derive query: `{ searchTerm: undefined, customerName: filters.name.trim() || undefined, area: filters.area || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo, sortBy: 'saleDate', sortOrder: 'desc', page, limit: LEDGER_PAGE_SIZE }`. Default window: on mount, if no `dateFrom`/`dateTo`, set to last 30 days (`new Date()` minus 30d → ISO date) — builder call from spec. Layout: `Card` with `LedgerFilters` row, summary row (three `Statistic`: `মোট বিল` sum grandTotal page, `মোট জমা` sum paidAmount, `মোট বাকি` sum dueAmount + `Typography.Text type=secondary` note "selected period only"), then `isMobile ? <LedgerCardList/> : <LedgerTable/>`.

- [ ] **Step 6: Run type check + lint**

Run: `cd client && npx tsc -b`
Expected: PASS. Run: `cd client && npx eslint src/features/ledgers --max-warnings=0`
Expected: PASS (fix any unused imports).

- [ ] **Step 7: Commit**

```bash
git add client/src/features/ledgers
git commit -m "feat(client): customer ledger purchase-list page"
```

### Task 4: Nav + routing + end-to-end verification

**Files:**
- Modify: `client/src/layouts/appLayout/menuItems.tsx`
- Modify: `client/src/router/router.tsx`
- Test: existing suites + builds

**Interfaces:**
- Consumes: `CustomerLedgerPage` default export (Task 3).
- Produces: `/customer-ledger` route rendering the ledger for admin + staff; nav label `লেজার (Ledger)`.

- [ ] **Step 1: Wire nav item**

In `menuItems.tsx`: import `BookOutlined` from `@ant-design/icons`; add `{ key: '/customer-ledger', label: 'লেজার (Ledger)', icon: <BookOutlined /> }` after `/customers` in `appMenuItems`; add `'/customer-ledger': 'salesParties'` to `ROUTE_GROUP_MAP`; add `'/customer-ledger': 'লেজার (Ledger)'` to `pageTitles`. No role restriction (all signed-in).

- [ ] **Step 2: Wire route**

In `router.tsx`: import `CustomerLedgerPage` from `../features/ledgers`; add `{ path: 'customer-ledger', Component: CustomerLedgerPage }` after the `customers/:id/edit` line inside the `AppLayout` children.

- [ ] **Step 3: Run full verification**

Run: `cd server && pnpm vitest run`
Expected: PASS. Run: `cd client && npx tsc -b`
Expected: PASS. Run: `cd client && npx eslint src/layouts/appLayout/menuItems.tsx src/router/router.tsx --max-warnings=0`
Expected: PASS.

- [ ] **Step 4: Manual QA checklist (report results in commit message body)**

Start both dev servers; login as staff: ledger nav visible, Rahim filter shows only Rahim rows with expandable products, Mirpur (any case) matches `mirpur`, date range narrows rows, empty state shows Bangla text, mobile width shows cards, summary sums match visible page.

- [ ] **Step 5: Commit**

```bash
git add client/src/layouts/appLayout/menuItems.tsx client/src/router/router.tsx
git commit -m "feat(client): nav+route for customer ledger"
```
