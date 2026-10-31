# Customer Ledger (Chronological) — Short Design

Date: 2026-10-31 | Approach picked: B (Backend merged endpoint)

## Intent / Why
Shop staff need one khata page to answer "oi date-er moddhe ke kinlo, ke taka dilo". Today `ViewCustomerPage` + `CustomerHistory.tsx` shows only one customer at a time, in two separate tabs (Purchases / Payments), with no date filter and no cross-customer view. A single chronological ledger with Name + date-range + Area filters closes that gap.

## Goals
- New navbar entry `লেজার (Ledger)` under Sales & Parties, visible to admin + staff, mobile via MoreSheet (bottom tabs unchanged).
- One table/cards list mixing `Sale` (debit) and `Payment` (credit), sorted by date, filterable by customer Name, date range (`dateFrom`/`dateTo`), Area.
- Header summary for the filtered range: total sold (debit), total collected (credit), net movement.
- Reuse existing patterns: `menuItems.tsx` grouping, `router.tsx` route, `useCustomerAreas` + `GET /customers/areas` for Area suggestions, AntD `RangePicker` + `Table` desktop / cards mobile like `PaymentsPage`.

## Non-goals
- No running-balance column in v1 (needs opening-balance history; deferred).
- No per-invoice profit, no lot details, no export/print in v1.
- No change to `Sale` / `Payment` create/void logic, no change to `Customer.dueBalance` logic.
- No bottom-tab change, no permission change (same as sales/payments: admin + staff).

## Anti-goals
- Must not show supplier/vendor payments in this ledger (customer side only: `customerId != null`).
- Must not include voided rows (`Sale.isDeleted`, `Payment.isDeleted` excluded).
- Must not mix CASH sale due logic: CASH sales appear with `dueAmount = 0`; their `paidAmount` is part of the sale row, not a separate payment row.
- Must not break `getPageTitle`, `selectedKey` (`startsWith`), or role filtering.

## Constraints
- Single permission source stays `appMenuItems` + `roles` in `client/src/layouts/appLayout/menuItems.tsx`.
- `Customer.area` is stored lowercase (`toStoredArea`/`normalizeArea` in `server/src/app/shared/normalize.ts`); Area filter must normalize identically.
- `Sale` indexed on `saleDate`, `customerId`; `Payment` indexed on `paidAt`, `customerId` — use these fields for filtering, no new index in v1.
- Never use worktrees; edit directly in local codebase, user pushes manually.
- Tech terms: `LedgerEntry`, `debit`, `credit`, `dateFrom`, `dateTo` keep in English.

## Approaches considered
- **A. Frontend merge (rejected):** reuse `GET /sales` + `GET /payments` and merge in browser like `CustomerHistory.tsx`. Quick, no backend. Rejected: no server-side date-range filter today (`sale.service.ts getAll` and `payment.service.ts getAll` whitelist params only), must download everything, pagination breaks, Area must be joined client-side.
- **B. Backend merged endpoint (picked):** new `GET /ledgers/customer-ledger?name=&area=&dateFrom=&dateTo=&page=&limit=&sortOrder=` returns merged entries + summary. Correct filtering, one pagination point, running-balance-free v1 stays honest. Costs a new module but matches `QueryBuilder` + `saleInclude`/`paymentInclude` patterns.
- **C. Per-customer statement only (rejected):** extend `ViewCustomerPage` with date filter. Rejected: user asked for cross-customer Name + Area filtering from navbar, not single-customer view.

## Decided (Approach B)
- Backend new module `server/src/app/modules/ledgers/` (`routes`, `controller`, `service`, `validation`, `interface`, `constant`):
  - `GET /ledgers/customer-ledger`, `auth('admin','staff')`.
  - Query: `name` (optional, `contains` insensitive on `customer.name`), `area` (optional, exact after `normalizeArea`), `dateFrom`/`dateTo` (optional ISO, inclusive; applied to `Sale.saleDate` and `Payment.paidAt` respectively), `page`/`limit` (default 1/20, max 100), `sortOrder` (`asc`/`desc`, default `desc`).
  - Default window [builder-check call]: frontend sends last 30 days on first load when user picks no dates; backend still allows unbounded range but caps each source fetch at `page*limit` (max 200) for performance.
  - Header copy [builder-check call]: summary shows "selected period only" disclaimer, because period net is not total owed (opening balance deferred to v2).
  - Logic: query sales (`isDeleted:false`, `saleType REGISTERED+CASH`, customer filter via relation) selecting `id, invoiceNo, saleDate, grandTotal, paidAmount, dueAmount, customer{id,name,phone,area}`; query payments (`isDeleted:false`, `customerId not null`, customer filter, `paidAt` range) selecting `id, paidAt, amount, method, saleId, sale{invoiceNo}, customer{...}`; map to `LedgerEntry { id, date, type: 'SALE'|'PAYMENT', customer, refInvoiceNo, debit, credit, saleId/paymentId }` where SALE `debit = grandTotal`, PAYMENT `credit = amount`; merge, sort by `date`, slice for page; `meta.total = salesTotal + paymentsTotal`; `summary { totalDebit, totalCredit, count }` computed over filtered full sets (not just page).
  - Validation with `zod`: date strings must parse, `dateFrom <= dateTo`, page/limit numbers.
- Frontend new feature `client/src/features/ledgers/`:
  - `types/ledger.types.ts`, `api/ledger.api.ts`, `hooks/useCustomerLedger.ts` (React Query `['ledgers','customer', params]`), `components/LedgerFilters.tsx` (Name `Input`, Area `Select` from `useCustomerAreas`, date `RangePicker`), `components/LedgerTable.tsx` + `LedgerCardList.tsx`, `pages/CustomerLedgerPage.tsx` with summary cards (`মোট বিক্রি`, `মোট আদায়`).
  - Route `/customer-ledger` in `router.tsx` (inside `RequireAuth` `AppLayout` children), nav item in `menuItems.tsx` (`{ key:'/customer-ledger', label:'লেজার (Ledger)', icon:<BookOutlined/> }`, group `salesParties`), `ROUTE_GROUP_MAP` + `pageTitles` entries.
- Cash-sale rule: SALE row shows `paid` hint (`paidAmount`) in expand/detail, no synthetic PAYMENT row is generated for it.

## Left to builder
- Exact `LedgerEntry` field names and whether `sortBy` beyond date is needed; keep `date` as only sort key in v1.
- Merge-pagination edge: two-source totals vs sliced page — document that `meta.total` is sum of both counts and page is post-merge slice; cap each source fetch at `page*limit` (max 200) and note approximation in code comment.
- `dateFrom`/`dateTo` day-boundary handling (start-of-day / end-of-day) — normalize server-side with plain `Date`, no extra lib.
- Verify: staff sees nav, area dropdown shows lowercase canonical areas, empty state in Bangla, mobile cards show same debit/credit.
