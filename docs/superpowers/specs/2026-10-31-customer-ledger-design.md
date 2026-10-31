# Customer Ledger (Purchase List) — Short Design

Date: 2026-10-31 | Approach picked: B-revised (Sales-only ledger, extend GET /sales)

## Intent / Why
Shop staff need one khata page to answer "ke kokhon ki kinlo, mot bill koto, koto dilo". Today `ViewCustomerPage` + `CustomerHistory.tsx` shows only one customer at a time, in two separate tabs, with no date filter and no cross-customer view. User clarified: ledger = shob customer-er kena-katar list; Name diye filter korle oi customer-er protita purchase row dekhabe, protita purchase-e ki ki product nilo, bill koto, pay koto. So v1 is sales-only, no separate collection rows.

## Goals
- New navbar entry `লেজার (Ledger)` under Sales & Parties, visible to admin + staff, mobile via MoreSheet (bottom tabs unchanged).
- One table/cards list of `Sale` rows (each purchase), sorted by `saleDate desc`, filterable by customer Name (`contains`), date range (`dateFrom`/`dateTo` on `saleDate`), Area (exact normalized).
- Each row shows: Date, Customer (name/phone/area), Invoice, Items count (expand to product details: product name, qty, sellingPrice, lineTotal), Bill (`grandTotal`), Paid (`paidAmount`), Due (`dueAmount`), Status.
- Header summary for filtered range: mot bill, mot pay, mot due + "selected period only" note.
- Reuse existing patterns: `menuItems.tsx` grouping, `router.tsx` route, `useCustomerAreas` + `GET /customers/areas` for Area suggestions, AntD `RangePicker` + `Table` desktop / cards mobile like `SalesPage` + `CustomerHistory.tsx` expand.

## Non-goals
- No separate Payment collection rows in v1 (sale-row `paidAmount`/`dueAmount` is enough; user confirmed purchase-list meaning).
- No running-balance column in v1, no per-invoice profit (admin-only profit stays in sales module), no export/print in v1.
- No change to `Sale` create/void logic, no change to `Customer.dueBalance` logic.
- No bottom-tab change, no permission change (same as sales: admin + staff).

## Anti-goals
- Must not show supplier/vendor purchases (customer sales only).
- Must not include voided sales (`isDeleted` excluded).
- Must include both REGISTERED and CASH sales (both are kena-kata; CASH shows `dueAmount = 0`).
- Must not break `getPageTitle`, `selectedKey` (`startsWith`), or role filtering.

## Constraints
- Single permission source stays `appMenuItems` + `roles` in `client/src/layouts/appLayout/menuItems.tsx`.
- `Customer.area` is stored lowercase (`toStoredArea`/`normalizeArea` in `server/src/app/shared/normalize.ts`); Area filter must normalize identically and filter via `customer.area` relation.
- `Sale` indexed on `saleDate`, `customerId` — use these fields, no new index in v1. `Sale.customer` relation needed for Name/Area filter.
- Never use worktrees; edit directly in local codebase, user pushes manually.
- Tech terms: `Sale`, `saleDate`, `dateFrom`, `dateTo`, `grandTotal`, `paidAmount`, `dueAmount` keep in English.

## Approaches considered
- **A. Frontend merge/filter (rejected):** reuse `GET /sales` as-is and filter in browser. Rejected: no server-side date-range / customer-name / area filter today (`sale.service.ts getAll` whitelists only `paymentStatus/saleType/customerId`), must download everything.
- **B-revised. Extend GET /sales + new Ledger page (picked):** add `customerName`, `area`, `dateFrom`, `dateTo` to `sale.service.ts getAll` (relation filter on `customer`, range on `saleDate`), reuse `saleInclude` with `customer{id,name,phone,area}` + `items{product,batch}`. Frontend new `features/ledgers` page calls `GET /sales` with these params. No new backend module, no merge logic, no CASH double-count problem. Matches user clarification (purchase list only).
- **C. New merged ledgers module SALE+PAYMENT (rejected after clarification):** earlier picked before clarification. Rejected now: user wants kena-katar list with product details, bill vs pay per purchase — payment rows would pollute this view and need opening-balance logic.

## Decided (Approach B-revised)
- Backend extend `server/src/app/modules/sales/` (`sale.service.ts`, `sale.validation.ts`):
  - New query: `customerName` (optional, `contains` insensitive on `customer.name`), `area` (optional, exact after `normalizeArea` on `customer.area`), `dateFrom`/`dateTo` (optional ISO, inclusive on `saleDate`; normalize to start-of-day / end-of-day server-side with plain `Date`), `customerId` still supported, `page`/`limit` (default 1/20, max 100), `sortOrder` default `desc` on `saleDate`.
  - Default window [builder-check call]: frontend sends last 30 days on first load when user picks no dates; backend allows unbounded but uses existing pagination.
  - Header copy [builder-check call]: summary shows "selected period only" disclaimer.
  - Response stays `TSaleResponse` (with `customer` + `items`); summary (`totalBill = sum grandTotal`, `totalPaid = sum paidAmount`, `totalDue = sum dueAmount`, `count`) computed — v1 can compute summary client-side from page totals + note, or server `summary` field if cheap; builder picks, must document.
  - Validation with `zod`: date strings must parse, `dateFrom <= dateTo`.
- Frontend new feature `client/src/features/ledgers/`:
  - `api/ledger.api.ts` calls `GET /sales` with `customerName, area, dateFrom, dateTo` params (thin wrapper over sales API shape), `hooks/useCustomerLedger.ts` (React Query `['ledgers','customer', params]` calling that api), `components/LedgerFilters.tsx` (Name `Input`, Area `Select` from `useCustomerAreas`, date `RangePicker`), `components/LedgerTable.tsx` (reuse `SaleTable` columns + Customer column + expandable `items` like `CustomerHistory.tsx`) + `LedgerCardList.tsx` for mobile, `pages/CustomerLedgerPage.tsx` with summary cards (`মোট বিল`, `মোট জমা`, `মোট বাকি`).
  - Route `/customer-ledger` in `router.tsx` (inside `RequireAuth` `AppLayout` children), nav item in `menuItems.tsx` (`{ key:'/customer-ledger', label:'লেজার (Ledger)', icon:<BookOutlined/> }`, group `salesParties`), `ROUTE_GROUP_MAP` + `pageTitles` entries.
- Cash-sale rule: include all sales; CASH rows show `DUE 0`, `paidAmount = grandTotal`.

## Left to builder
- Summary exact source: client-side page sums vs server `summary` aggregate — pick one, must say "selected period only".
- `dateFrom`/`dateTo` day-boundary handling (start-of-day / end-of-day) — normalize server-side with plain `Date`, no extra lib.
- Verify: staff sees nav, Rahim filter shows only Rahim rows with expandable product details, area dropdown shows canonical areas, empty state in Bangla, mobile cards show same bill/paid/due.
