# E3 — Catalog + Inventory Correctness

Depends on: E1
SRS refs: Sections 4.4–4.9, Rule 4, Rule 5, Rule 7

## Goal

Catalog stays as built, plus staff cost-hiding, locked badge thresholds, and a FIFO helper E4 can reuse.

## Backend implementation (`server/`)

- [ ] `src/app/modules/products/product.service.ts`:
  - Thread `req.user.role` (or a `role` param) into `getAll/getById` response mapping: if `role === 'staff'`, omit `purchasePrice` (keep `sellingPrice`, `vatPercent` only if needed for totals preview — decide once: ___). Admin keeps full fields.
  - Keep `assertCategoryMatches` (`category.productType === product.productType`), exactly-one-extension rule (MEDICINE → `medicineDetails`, FEED → `feedDetails`), `OPENING` batch + ledger seed on create.
  - Add exported helper `getFifoLots(productId, tx)`: batches `where { productId, isDeleted: false }`, `orderBy { expiryDate: 'asc' }`, skip `stock <= 0`. (E4 calls this inside its transaction.)
- [ ] `src/app/modules/products/product.routes.ts`: read routes stay public or `auth()` per decision; write routes `auth('admin','staff')` with service-level check that staff cannot set `purchasePrice` directly (admin-only field on create/update, or staff create blocked — pick once: ___).
- [ ] No schema change expected. If needed, index check: `@@index([productType])`, `@@index([categoryId])`, `@@index([expiryDate])` already present.
- [ ] Verify in `server/`: generate + `tsc --noEmit` + `eslint` + `test`.

## Frontend implementation (`client/src/`)

- [ ] `features/products/data/product.constants.ts`: set `NEAR_EXPIRY_DAYS = 20`, `CRITICAL_STOCK_RATIO = 0.4` (SRS Rule 7). Remove old `90` / `0.25`.
- [ ] `features/products/utils/productStatus.ts`: no logic change needed (already `stock <= minStock` → Low, `stock < minStock * ratio` → Critical, earliest-expiry → Near/Expired) — verify against new constants only.
- [ ] `features/products/components/ProductTable/`: hide Purchase-price column when logged-in role is `staff`; same for `ProductDetails` and POS rows. Show qty, selling price, badges only.
- [ ] `features/products/hooks/useProducts/` + `api/product.api.ts`: no shape change; confirm `ProductResponse.batches[]` still drives `getTotalStock` / `getEarliestExpiry`.
- [ ] `features/dashboard/utils/alerts.ts`: low-stock and expiry alert lists automatically follow new thresholds — verify with a minStock-20 product at stock 8 (Critical) and a 19-day expiry (Near Expiry).

## Done when

- [ ] Backend verify green; staff product JSON has no `purchasePrice`
- [ ] `vite build` passes
- [ ] Manual: staff sees qty/badges only; admin sees costs; badge examples match Rule 7

## Deferred

- File uploads, costing choice (GAP-1 stays open — E4 snapshots keep it future-proof)
