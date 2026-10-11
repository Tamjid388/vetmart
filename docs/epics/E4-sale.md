# E4 — POS Sale (create) — IMPLEMENTED 2026-09-19

Depends on: E1, E2, E3
SRS refs: Sections 4.10, 4.11, Rules 9–18, Section 7 sales API

## Goal

Atomic Complete Sale: required customer, FIFO deduction, server-computed totals, idempotent, auditable.

## Backend implementation (`server/`)

- [x] New file `prisma/schema/sale.prisma`: `SalePaymentMethod { CASH BKASH NAGAD CARD }`, `SalePaymentStatus { PAID PARTIAL DUE }`, `Sale` (`invoiceNo @unique`, `idempotencyKey @unique`, `customerId FK required indexed`, `saleDate @default(now()) indexed`, `subtotal`, `discount @default(0)`, `vatTotal @default(0)`, `grandTotal`, `paidAmount`, `dueAmount @default(0)`, `paymentMethod?`, `paymentStatus indexed`, `soldBy FK indexed`, `notes?`, `isDeleted @default(false)`, timestamps, relations `customer/items/soldByUser`), `SaleItem` (`saleId cascade indexed`, `productId restrict indexed`, `batchId? SetNull indexed`, `qty`, `sellingPrice`, `purchasePrice`, `vatPercent @default(0)`, `lineTotal`, relations). Migrate + `pnpm db:generate`.
- [x] New module `src/app/modules/sales/` (products pattern + `sale.logic.ts` pure FIFO/totals helpers with `sale.logic.test.ts`):
  - `sale.validation.ts`: Zod `create` — `{ idempotencyKey: uuid, customerId: cuid, items: [{ productId: cuid, qty: int >= 1 }].min(1), discount >= 0 optional, paymentMethod enum optional, paidAmount >= 0, notes? }`.
  - `sale.service.ts` — `createSale(data, soldBy)` in `prisma.$transaction`: (1) check `idempotencyKey` existing → return it; (2) load customer (not deleted) else `404`; (3) lock `Product` rows `FOR UPDATE` ordered by `id`; (4) FIFO oldest-`expiryDate`-first skipping zero-stock and expired lots, one `SaleItem` per product per lot; short or only-expired → `409 + { requested, available }` per line via `AppError.details`; (5) compute `lineTotal/subtotal/vatTotal (VAT-exclusive, 2-decimal line rounding)/grandTotal/dueAmount/paymentStatus`; guards (`discount <= subtotal + vatTotal`, `paidAmount <= grandTotal`, method required iff `paidAmount > 0`); (6) generate `invoiceNo` (serialized counter + P2002 retry ×3); (7) create `Sale` + items, `StockLedger SALE` per item (`refId = sale.id`, `createdBy = soldBy`), `Customer.dueBalance += dueAmount`. Map P2002 on `idempotencyKey` → return existing.
  - `sale.interface.ts`: payload/response types, `purchasePrice` snapshot omitted for staff, `SaleSearchableFields = ['invoiceNo']`.
  - `sale.controller.ts` + `sale.routes.ts`: `POST /` + `GET /` + `GET /:id`, all `auth('admin','staff')`; pass `req.user.userId/role` into service; strip `purchasePrice` snapshots when `role === 'staff'`. Create returns `201`, idempotent retry returns `200` with the original sale.
- [x] `src/app/routes/index.ts`: mount `{ path: '/sales', route: SaleRoutes }`.
- [x] Invoice counter: single-row counter table `sale_counter` (id always `'sale'`), atomic `UPDATE...RETURNING` inside the sale transaction; `SALE-00001` format; unique backstop + retry.
- [x] Verify in `server/`: generate + `tsc --noEmit` + `eslint` + `test` (+ unit tests for FIFO/totals; live smoke: create → retry same key → oversell `409`, expired-only `409`, staff cost-strip — 31 assertions green).

## Frontend implementation (`client/src/`)

`features/sales/` exists as stubs (`Sale = { id }`) — flesh out following `features/products/` conventions.

- [x] `types/sale.types.ts` + `api/sale.api.ts` (`BASE = '/sales'`): `createSale({ idempotencyKey: crypto.randomUUID(), customerId, items, discount, paymentMethod, paidAmount })`, `getSales`, `getSaleById`. Request type mirrors Zod input; response type includes snapshots + `paymentStatus`.
- [x] `hooks/useSales/`, `hooks/useSale/`, `hooks/useSaleMutations/`: list query + `useMutation(createSale)` with idempotency key generated once per checkout attempt (key survives retries until success, then regenerated). Invalidate `['sales']`, `['customers']` (due changed), `['products']` (stock changed) on success.
- [x] `components/SaleForm/`: customer search-select (required, inline-create entry linking to `/customers/new`), cart lines with qty steppers, per-line stock availability display, discount input, payment method radio (Cash/bKash/Nagad/Card, hidden when paid = 0), paid-amount input, live totals preview using the same rounding rule (line-level 2 decimals). Disable submit when cart empty or no customer. Show `409` short-stock message with available qty.
- [x] `pages/CreateSalePage/` (POS terminal): wire form → mutation; on success navigate to receipt/detail with `invoiceNo`; on `409` keep cart intact.
- [x] `components/SaleTable/` + `SaleDetails/`: invoice, customer, totals, paid/due, status badges (Paid/Partial/Due); never render `purchasePrice` snapshot for `staff` role.
- [x] `router/router.tsx`: keep `/sales`, `/sales/new`, `/sales/:id/edit` — edit route repurposed as view-only receipt detail (no sale edit in v1 per Rule 19).

## Done when

- [x] Backend verify green; duplicate phone/`409` paths tested
- [x] `vite build` passes
- [x] Manual: 2-product partial-pay sale → due correct; same-key retry deducts once; oversell and expired-only both `409` with cart intact; staff sees no cost snapshots

## Split if dragging

- E4a = above (create). E4b = void + tests move to E5 if needed.

## Deferred

- Split payments, per-line discounts, partial returns, drafts (GAP-3/4)
