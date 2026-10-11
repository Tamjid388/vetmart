# E6 — Purchase / GRN Module (stock-in + vendor payables) — IMPLEMENTED 2026-09-19

Depends on: E1–E5
SRS refs: Sections 4.12, 4.13, 4.14, Rules 1, 20–22, Section 7 purchase endpoints, GAP-4 (restock covered)

## Goal

Close the stock-in hole: supplier GRNs create/merge lots, accrue payables, and unlock vendor due collection. After this epic, `Supplier.payableBalance` moves for the first time and restocking no longer depends on product-create `initialBatch`.

## Backend implementation (`server/`)

- [x] `prisma/schema/purchase.prisma` (new): `Purchase` (`invoiceNo @unique`, `idempotencyKey @unique`, `supplierId FK Restrict indexed`, `purchaseDate @default(now()) indexed`, `subtotal/discount/vatTotal/grandTotal/paidAmount/dueAmount Decimal(12,2)`, `paymentMethod SalePaymentMethod?`, `paymentStatus SalePaymentStatus indexed`, `receivedBy FK Restrict indexed`, `notes?`, `isDeleted @default(false)`, timestamps, relations `supplier/items/receivedByUser`), `PurchaseItem` (`purchaseId cascade indexed`, `productId restrict indexed`, `batchId? SetNull indexed`, `qty`, `purchasePrice Decimal(10,2)`, `sellingPrice` snapshot, `vatPercent`, `lineTotal Decimal(12,2)`, `batchNumber?`, `expiryDate?`, `weightKg?`), `PurchaseCounter` (single row `id='purchase'`, serialized `PR-00001` numbering). Back-relations: `Supplier.purchases`, `ProductBatch.purchaseItems`.
- [x] `payment.prisma` extension: `Payment.supplierId? FK Restrict indexed` + `supplier` relation (`Supplier.vendorPayments`), `Payment.purchaseId? FK SetNull indexed` + `purchase` relation (`Purchase.payments`). Customer side untouched.
- [x] Migrate + `pnpm db:generate` (new migration `0006_purchase_grn` or next number; tables start empty, no backfill).
- [x] New module `src/app/modules/purchases/` (mirror `sales/` 8-file shape, minus `*.logic.ts` split only if needed):
  - `purchase.constant.ts`: `PurchaseSearchableFields = ['invoiceNo']` (reuse `SALE_PAYMENT_METHODS`-style enum? No — reuse `SalePaymentMethod`/`SalePaymentStatus` Prisma enums directly, no new constant arrays needed beyond search fields).
  - `purchase.interface.ts`: `ICreatePurchasePayload` (`idempotencyKey UUID`, `supplierId`, `items: [{ productId, qty>=1, purchasePrice>=0, batchNumber?, expiryDate ISO, weightKg? }]`, `discount?`, `paymentMethod?`, `paidAmount`, `notes?`), `TPurchaseResponse` (Decimal→number via `toNumber`, populated `supplier{id,companyName,phone}`, items with `product{id,name,unit}` + `batch{id,batchNumber,expiryDate}`), `TPopulatedPurchase`.
  - `purchase.logic.ts` (+ `purchase.logic.test.ts`): pure `computePurchaseTotals(lines, discount, paidAmount)` (`lineTotal = round2(qty*purchasePrice)`, same rounding rule as sales) — unit-tested without DB, mirroring `sale.logic.test.ts`.
  - `purchase.validation.ts`: Zod create schema (`.strict()`; `expiryDate` required string per line; `weightKg` optional positive).
  - `purchase.service.ts`: `create` (idempotency-first, supplier active check, merge duplicate lines same product+same batchNumber with `400` on same-lot cost conflict, atomic tx: lots create/merge + `PURCHASE` ledger + `Product.purchasePrice` last-lot-cost update + `Supplier.payableBalance += dueAmount`; P2002 `invoiceNo` retry ×3, `idempotencyKey` race returns original; `(productId,batchNumber)` merge-race re-read once), `getAll` (QueryBuilder + `PurchaseSearchableFields`, filters `supplierId/paymentStatus/receivedBy`, sort `purchaseDate`), `getById`, `voidPurchase` (admin: stock-sufficiency `409` guard, `RETURN` ledger negative delta, payable reversal, double-void `409`). All responses admin-shaped (module is `auth('admin')` — no role-stripping needed).
  - `purchase.controller.ts` (201 on create / 200 on idempotent retry, same messages style as sales), `purchase.routes.ts` (`GET/POST /`, `GET /:id`, `POST /:id/void`, all `auth('admin')`; no PATCH/DELETE).
- [x] `src/app/routes/index.ts`: mount `{ path: '/purchases', route: PurchaseRoutes }`.
- [x] `payments` module extension (Section 4.14): `payment.validation.ts` accepts `{ supplierId, amount, method, purchaseId? }` XOR customer side; `payment.service.ts` validates one-side-only (`400`), purchase-belongs-to-supplier (`400`), `amount <= payableBalance` (`400`), tx creates payment + `payableBalance -= amount`; `getAll` gains `supplierId`/`purchaseId` filters. `payment.interface.ts` populates optional `supplier{}`.
- [x] Verify in `server/`: generate + `tsc` build + `eslint` + `test` (incl. new `purchase.logic.test.ts`).

## Frontend implementation (`client/src/`)

Scaffold exists (`features/purchases/` stubs) and routes exist (`/purchases`, `/purchases/new`, `/purchases/:id/edit` = receipt view, same as sales). No `api/` folder yet — create it (E2 pattern).

- [x] `features/purchases/api/purchase.api.ts` (+ `index.ts`): `BASE='/purchases'`; `getPurchases(params)`, `getPurchaseById(id)`, `createPurchase(payload)`, `voidPurchase(id)`.
- [x] `types/purchase.types.ts`: `PurchaseResponse { id, invoiceNo, supplierId, purchaseDate, subtotal, discount, vatTotal, grandTotal, paidAmount, dueAmount, paymentMethod?, paymentStatus, receivedBy, notes?, supplier?, items: PurchaseItemResponse[] }`, `PurchaseItemResponse { id, productId, batchId?, qty, purchasePrice, sellingPrice, vatPercent, lineTotal, batchNumber?, expiryDate?, weightKg?, product?, batch? }`, `CreatePurchasePayload/ItemPayload`, `PurchaseListQueryParams/Meta/Filters`, `PAYMENT_STATUS` labels.
- [x] `hooks/`: `usePurchases(params)` key `['purchases', params]` (+ `keepPreviousData`, products-page pattern); `usePurchase(id)` key `['purchase', id]`; `usePurchaseMutations` (`createPurchase` invalidates `['purchases'] + ['purchase'] + ['products'] + ['product'] + ['vendors'] + ['vendor']`; `voidPurchase` same + navigate).
- [x] `components/PurchaseForm/`: GRN entry — `VendorSearchSelect`-equivalent supplier picker (see vendors item below; supplier required, show payable warning), product `Select showSearch filterOption={false}` fed by `useProducts` (admin sees cost), per-line `qty` + `purchasePrice` + `batchNumber?` + `expiryDate` (DatePicker, required) + `weightKg?`; cart `Table` with `lineTotal = round2(qty*price)`; `discount` + `paidAmount` + `paymentMethod` radio (iff paid>0) + `notes` (challan ref); `computeTotalsPreview` in `utils/format.ts` (mirror sales); `canSubmit = supplierId && lines valid && !submitting`. Idempotency key owned by `CreatePurchasePage` (mirror `CreateSalePage`: `idempotencyKeyRef`, regenerate after success).
- [x] `components/PurchaseTable/` (admin: invoice, supplier, date, items count, grandTotal, paid/due + status badge; cost columns visible — module is admin-only), `PurchaseFilters` (search invoice + supplier + status + date; mirror `SaleFilters`), `PurchaseDetails` (header + lines + void button admin-only, mirror `SaleDetails` confirm copy: un-receive + payable reversal).
- [x] `pages/`: wire `PurchasesPage` (list + pagination + `keepPreviousData` states), `CreatePurchasePage` (form + 201/200 handling), `EditPurchasePage` (receipt view — no edit form, same as sales).
- [x] `features/vendors/`: add `VendorSearchSelect` (mirror `CustomerSearchSelect` props: `value/onChange/placeholder/onCreateNew/disabled`; options show companyName + phone + payable tag; query `useVendors({searchTerm, limit:10})`).
- [x] `features/payments/`: vendor tab goes functional — supplier picker + payable display + due-capped amount + method + optional purchase link + vendor-scoped history table (mirror customer tab; `PaymentForm` gains supplier mode or a `VendorPaymentForm`).
- [x] `router/router.tsx`: no new routes needed (already present). Cost gating: purchases nav visible to admin only (mirror Reports `RequireAdmin` or `useMe().isAdmin` menu guard — pick once during implement).
- [x] `vite build` passes.

## Done when

- [x] Backend verify green; `POST /purchases` creates lots + ledger + payable in one tx
- [x] Double-submit same `idempotencyKey` → `200` original, no new lots
- [x] `vite build` passes
- [x] Manual: GRN with 2 lines (one new lot, one merged lot) → stock sums correct; supplier payable += due; void blocked `409` after partial sale of the lot; vendor collection reduces payable; over-collection `400`

## Deferred

- Purchase edit / partial void (mirrors sale Rule 19 scope)
- Auto-settlement of vendor payments on void (payable may go negative — manual settle, Rule 22)
- Supplier price lists / last-price suggestion in the GRN form (nice-to-have; `Product.purchasePrice` already prefill-able)
