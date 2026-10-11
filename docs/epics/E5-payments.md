# E5 — Payments + Void Wiring (go-live gate) — IMPLEMENTED 2026-09-19

Depends on: E4
SRS refs: Rule 19, Section 7 void endpoint, GAP-2

## Goal

Dues created by E4 can be cleared; mistakes can be voided. No live POS without this epic.

## Backend implementation (`server/`)

- [x] `POST /sales/:id/void` (admin only) in `sales` module: full-sale void in one transaction — set `Sale.isDeleted = true`, restock each lot (`ProductBatch.stock += item.qty`), `StockLedger RETURN` per item (`refId = sale.id`, `createdBy = admin id`), `Customer.dueBalance -= sale.dueAmount`. Double void → `409`. No partial void, no edit.
- [x] Minimal `Payment` (new small module `src/app/modules/payments/`): `prisma/schema/payment.prisma` — `Payment { id, saleId? FK, customerId FK required indexed, amount > 0, method SalePaymentMethod, collectedBy FK required, paidAt @default(now()), isDeleted @default(false) }`. `POST /payments`: validate `amount <= Customer.dueBalance` else `400`; transaction creates payment + `Customer.dueBalance -= amount`. `GET /payments?customerId=` for history. Role gate `auth('admin','staff')`.
- [x] Verify in `server/`: generate + `tsc --noEmit` + `eslint` + `test`.

## Frontend implementation (`client/src/`)

- [x] `features/payments/` (was scaffold — now wired to API): `api/payment.api.ts` (`createPayment`, `getPayments`, `getPaymentById`), `usePayments`/`usePayment`/`usePaymentMutations`, `CreatePaymentPage` form (customer select required, amount with max = current due, method radio, sale link optional), `PaymentsPage` table with Customer/Vendor tabs (vendor tab placeholder until Purchase module).
- [x] `features/sales/components/SaleDetails/`: Void button visible to `admin` only, with confirm dialog; on success invalidate sales + customers + products queries.
- [x] `features/customers/`: due badge (existed) + Record Payment entry point on the customer detail page (`Record Payment` prefilled with `customerId`).
- [x] `router/router.tsx`: keep `/payments`, `/payments/new`; void is an action on sale detail, not a separate page.

## Done when

- [x] Backend verify green
- [x] `vite build` passes
- [ ] Manual: due sale → partial collection reduces due; over-collection blocked (`400`); admin void restores stock + reverses due; double void → `409`

## Deferred

- Partial-line returns, sale edits, restock-to-new-batch (GAP-4)
