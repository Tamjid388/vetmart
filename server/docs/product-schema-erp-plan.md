# Product Schema — ERP Gap & Plan (VetMart)

**Scope:** `server/prisma/schema.prisma` → `model Product` + medicine/feed split. Implemented 2026-09-17 as split `prisma/schema/*.prisma` + `0002_product_erp`.
**Date:** 2026-09-17 (updated: medicine + feed hybrid — owner decision; FIX: StockLedger↔ProductBatch relation; IMPLEMENTED split schema)
**Sources:** `prisma/schema.prisma:42-53`, `client/prd.md §5 Products + §10 Business Rules`, `client/src/features/products/types/product.types.ts:12-25`, `server/docs/architecture.md §9`

---

## 1. Current state

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

Backend validation (`product.validation.ts`, `product.interface.ts`) mirrors this: `name, description?, price, stock?` only.

Seed (`prisma/seed.ts`) creates 3 products with `price + stock` only.

---

## 2. What ERP / PRD / Frontend requires

From `client/prd.md`:

- **Product Catalog table:** Product Name, Category, Unit, Purchase (৳), Selling (৳), Stock, Min Stock, Expiry, Status, Actions
- **Add Product form:** Product Name, Category, Unit/Formulation, Purchase Price (৳), Selling Price (৳), Minimum Stock Warning Level, VAT %, Description/Composition, Initial Batch Number, Expiry Date, Initial Stock Quantity
- **Business Rules:** Product has purchase price, selling price, VAT %, min stock, batch, expiry. Low stock when `stock <= minStock`. Near Expiry/Expired based on expiry date. Purchase price / profit / vendor outstanding are sensitive — hidden from salesman role.
- **Dashboard / Reports depending on Product:** Low Stock Alert, Near Expiry/Expired table, Current Stock Value, Today's Profit, Stock Report, Expiry Report, Sales Report filter by Manufacturer/Medicine, Purchase vs Sales chart.

From `client/src/features/products/types/product.types.ts`:

```ts
Product = { id, name, category, unit, purchasePrice, sellingPrice, stock, minStock, expiryDate, vatPercent, description, batchNumber }
```

### New requirement (2026-09-17): two product types

Shop sells 2 types with different accounting:

- **Medicine** — current schema/PRD basis (Tablet/Strip/Bottle, generic, strength, strict batch + expiry).
- **Feed** — chicken/cow/fish food. **Sale bag-only** (no loose-kg). **Pack sizes differ** (25kg vs 50kg = separate SKU) **+ per-lot actual weight varies** (e.g. 25kg bag arrives 24.8/25.2kg). Expiry **required** for feed too; batch number **optional** for feed (owner: "not sure about batch").

Design consequence: unified `Product` base (shared purchase/sale/stock/ledger/reports) + type-specific extension tables (§3.4–3.5). Separate menus in UI = `?productType=` filter, not separate base tables.

### Gap matrix

| Required | Backend today | Impact if missing |
|---|---|---|
| `category` (filter) | ❌ | Catalog filter, category pills on POS broken |
| `unit` / formulation | ❌ | POS + catalog incomplete |
| `purchasePrice` (separate) | ❌ (only single `price`) | Costing, Profit Report, Stock Value impossible; role-hiding impossible |
| `sellingPrice` (separate) | ⚠️ ambiguous (`price`) | Same as above |
| `minStock` | ❌ | Low/Critical alerts, Dashboard KPI impossible |
| `vatPercent` | ❌ | POS totals (Subtotal/Discount/VAT/Grand Total) wrong |
| `batchNumber` | ❌ | Purchase traceability, POS search `medicine, batch` broken |
| `expiryDate` | ❌ | Near Expiry/Expired, Expiry Report impossible |
| `sku` / barcode / genericCode | ❌ | POS search by generic code, barcode placeholder (PRD Out-of-Scope HW, but UI placeholder OK) impossible |
| `manufacturer` / vendor link | ❌ | Reports filter by Manufacturer, Vendor Purchases flow impossible |
| `isActive` / `status` | only `isDeleted` | Can't disable without deleting; derived status (In Stock / Low / Critical / Near Expiry / Expired) must be computed |
| relations to Purchase/Sale/Payment | ❌ isolated model | Full `Vendor → Purchase → Stock → POS Sale → Due → Payment` flow impossible |

**Verdict: No, current fields are not enough — even for the frontend demo contract, let alone an ERP.**

---

## 3. Decision: Option B-hybrid — unified Product + extension tables (chosen, no code changes yet)

**Category: table (chosen — enum rejected).** Reason: vet taxonomy vs human-pharmacy mismatch is a known PRD risk; new categories must not require a migration. Category now carries `productType` so Medicine vs Feed catalogs/menus stay separate.

### 3.1 Category table

| Field | Type | Constraints | Notes / PRD source |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | PK |
| `productType` | `Enum` | `MEDICINE / FEED`, `@@index([productType])` | Separates medicine categories (Antibiotic, Vitamin) from feed (Layer, Broiler, Dairy, Fish). Drives separate menus |
| `name` | `String` | `@@unique([productType, name])` | e.g. MEDICINE: Tablet, Syrup, Vaccine; FEED: Layer, Broiler. Catalog filter + POS pills |
| `isActive` | `Boolean` | `@default(true)` | Hide without deleting |
| `createdAt` | `DateTime` | `@default(now())` | — |
| `updatedAt` | `DateTime` | `@updatedAt` | — |
| `products` | `Product[]` | relation | 1 category → N products |

### 3.2 Product table (unified base — no batch/expiry, no type-specific specs here)

All `PurchaseItem / SaleItem / StockLedger` FKs point here, so reports work across both types.

| Field | Type | Constraints | Notes / PRD source |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | PK |
| `productType` | `Enum` | `MEDICINE / FEED`, `@@index([productType])` | Discriminator. Decides which extension row is required + which validation applies |
| `sku` | `String?` | `@unique` | POS search, barcode placeholder (v1 decided) |
| `name` | `String` | required | Product Name. Feed: include pack size in name, e.g. `ACI Layer 25kg` (each pack size = separate row) |
| `description` | `String?` | optional | Description / Composition |
| `categoryId` | `String` | FK → `Category` | Must match `productType` (enforced in service: feed product → feed category) |
| `unit` | `Enum` | `ProductUnit`, required | Sale unit (§3.9). Medicine: PIECE/STRIP/BOTTLE/VIAL/AMPOULE/TUBE/SACHET. Feed: BAG (sale bag-only) / KG / LITER as needed |
| `purchasePrice` | `Decimal(10,2)` | required | Per sale unit (per bag / per strip). Sensitive — hidden from salesman. Costing TBD §5 Q2 |
| `sellingPrice` | `Decimal(10,2)` | required | Migrated from current `price` |
| `minStock` | `Int` | `@default(0)` | In sale units (bags / strips). Low/Critical alert, Dashboard KPI |
| `vatPercent` | `Decimal(5,2)` | `@default(0)` | Per-product only (decided). POS totals |
| `manufacturer` | `String?` | optional | Medicine company / feed mill. Reports filter by Manufacturer (v1 decided) |
| `barcode` | `String?` | `@unique` | Barcode placeholder (v1 decided) |
| `imageUrl` | `String?` | optional | Future upload (roadmap §13.3) |
| `isActive` | `Boolean` | `@default(true)` | Disable without deleting |
| `isDeleted` | `Boolean` | `@default(false)` | Existing soft-delete, keep |
| `createdAt` / `updatedAt` | `DateTime` | auto | — |
| `medicineDetails` | `MedicineDetails?` | 1-1, required iff `MEDICINE` | §3.4 |
| `feedDetails` | `FeedDetails?` | 1-1, required iff `FEED` | §3.5 |
| `batches` | `ProductBatch[]` | relation | 1 product → N batches |
| `ledger` | `StockLedger[]` | relation | Audit trail |

### 3.3 Why hybrid (unified + extensions) instead of two separate base tables

Separate `MedicineProduct` + `FeedProduct` base tables would force duplicate `PurchaseItem / SaleItem / StockLedger / ProductBatch` relations and split every report (Stock Value, Profit, Due) per table. UI already gets separation via `?productType=` filter + separate menus. Extensions keep validation clean without duplicating flows.

### 3.4 MedicineDetails table (1-1 → Product, required iff MEDICINE)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `productId` | `String` | `@id, FK → Product cascade` | PK = FK (one row per medicine) |
| `form` | `Enum?` | `MedicineForm`, optional | Dosage form: TABLET / CAPSULE / SYRUP / INJECTION / CREAM / OINTMENT / POWDER / DROPS / SUSPENSION / SOLUTION / OTHER (§3.9) |
| `genericName` | `String?` | optional | POS search by generic code (moved from Product — medicine-only, v1 decided) |
| `strength` | `String?` | optional | e.g. 500mg. Pending §5 Q8 (strength/prescription decision) |
| `requiresPrescription` | `Boolean` | `@default(false)` | Pending §5 Q8 |

### 3.5 FeedDetails table (1-1 → Product, required iff FEED)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `productId` | `String` | `@id, FK → Product cascade` | PK = FK (one row per feed SKU) |
| `targetSpecies` | `String?` | optional | chicken / cow / fish. Pending §5 Q6 (owner "not sure") |
| `feedType` | `String?` | optional | Layer / Broiler / Dairy / Fish. Pending §5 Q6 |
| `proteinPct` | `Decimal(5,2)?` | optional | e.g. 18.50. Pending §5 Q6 |
| `nominalPackKg` | `Decimal(8,2)?` | optional | Label pack size: 25 / 50. Each pack size = separate Product row |

### 3.6 ProductBatch table (one row per purchase lot — both types)

| Field | Type | Constraints | Notes / PRD source |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | PK |
| `productId` | `String` | FK → `Product` cascade | Parent product |
| `batchNumber` | `String?` | optional | Medicine: required. Feed: optional (owner "not sure about batch"). `@@unique([productId, batchNumber])` — PG allows multiple NULLs, so feed lots without batch no. don't collide |
| `expiryDate` | `DateTime?` | `@@index([expiryDate])` | Required for BOTH types (owner: feed expiry must). Near Expiry / Expired, Expiry Report |
| `purchasePrice` | `Decimal(10,2)` | required | This lot's cost per sale unit (per bag / strip). FIFO support |
| `stock` | `Int` | `@default(0)` | This lot's qty in sale units (bags / strips). Product stock = sum(lots) |
| `weightKg` | `Decimal(10,2)?` | optional | Feed-only: actual lot weight for weight-variation case (e.g. 25kg bag arrives 24.8kg). Pending mandatory-vs-optional §5 Q7 |
| `receivedAt` | `DateTime` | `@default(now())` | Lot receipt date |
| `ledgerEntries` | `StockLedger[]` | relation (back-relation of `StockLedger.batch`) | Audit rows pointing at this lot |
| — | — | `@@unique([productId, batchNumber])` | Same batch no. can't repeat in one product (NULLs exempt in PG) |
| — | — | `@@index([productId])` | Lot lookup per product |

> **Fix 2026-09-17:** `ProductBatch.ledgerEntries ↔ StockLedger.batch` was missing. Without the back-relation Prisma rejects the schema (`batchId` had no `@relation`). It is now required (see §3.8).

### 3.7 StockLedger table (audit — every stock change)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | PK |
| `productId` | `String` | FK → `Product` cascade, `@@index([productId, createdAt])` | Which product moved |
| `batchId` | `String?` | FK → `ProductBatch` `SetNull`, `@@index([batchId])` | Which lot moved (null for master adjust). Relation field `batch` required — was missing before fix |
| `batch` | `ProductBatch?` | `@relation(fields: [batchId], references: [id], onDelete: SetNull)` | Lot relation. `onDelete: SetNull` preserves audit trail when a lot is deleted |
| `type` | `Enum` | `PURCHASE / SALE / ADJUSTMENT / RETURN / OPENING` | Movement reason |
| `qtyDelta` | `Int` | required (+/-) | e.g. `+50` purchase, `-2` sale |
| `stockAfter` | `Int` | required | Balance after move |
| `refId` | `String?` | optional | Purchase/Sale invoice id (future) |
| `createdBy` | `String?` | optional | User id (future) |
| `createdAt` | `DateTime` | `@default(now())` | — |

> **Fix 2026-09-17:** added `batch ProductBatch? @relation(...)` + `@@index([batchId])`. Service invariant (not a DB CHECK): when `batchId` is set, `productId` MUST equal `batch.productId` — enforced in service/transaction, because PG can't enforce cross-FK equality declaratively. Negative `stockAfter` allowed per §5 Q4.

### 3.8 Proposed Prisma schema (copy-paste ready for P1 — implemented split, see `prisma/schema/*.prisma`)

```prisma
enum ProductType {
  MEDICINE
  FEED
}

enum MedicineForm {
  TABLET
  CAPSULE
  SYRUP
  INJECTION
  CREAM
  OINTMENT
  POWDER
  DROPS
  SUSPENSION
  SOLUTION
  OTHER
}

enum ProductUnit {
  PIECE
  STRIP
  BOTTLE
  BOX
  VIAL
  AMPOULE
  TUBE
  SACHET
  BAG
  KG
  LITER
  OTHER
}

enum StockLedgerType {
  PURCHASE
  SALE
  ADJUSTMENT
  RETURN
  OPENING
}

model Category {
  id          String      @id @default(cuid())
  productType ProductType
  name        String
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  products    Product[]

  @@unique([productType, name])
  @@index([productType])
  @@map("categories")
}

model Product {
  id              String            @id @default(cuid())
  productType     ProductType
  sku             String?           @unique
  name            String
  description     String?
  categoryId      String
  category        Category          @relation(fields: [categoryId], references: [id])
  unit            ProductUnit // MEDICINE: PIECE/STRIP/BOTTLE/VIAL/AMPOULE/TUBE/SACHET; FEED: BAG (sale bag-only)
  purchasePrice   Decimal           @db.Decimal(10, 2)
  sellingPrice    Decimal           @db.Decimal(10, 2)
  minStock        Int               @default(0)
  vatPercent      Decimal           @db.Decimal(5, 2) @default(0)
  manufacturer    String?
  barcode         String?           @unique
  imageUrl        String?
  isActive        Boolean           @default(true)
  isDeleted       Boolean           @default(false)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  medicineDetails MedicineDetails?
  feedDetails     FeedDetails?
  batches         ProductBatch[]
  ledger          StockLedger[]

  @@index([productType])
  @@index([categoryId])
  @@map("products")
}

model MedicineDetails {
  productId             String        @id
  product               Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  form                  MedicineForm?
  genericName           String?
  strength              String?
  requiresPrescription  Boolean       @default(false)

  @@map("medicine_details")
}

model FeedDetails {
  productId      String   @id
  product        Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  targetSpecies  String?
  feedType       String?
  proteinPct     Decimal? @db.Decimal(5, 2)
  nominalPackKg  Decimal? @db.Decimal(8, 2)

  @@map("feed_details")
}

model ProductBatch {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  batchNumber   String?
  expiryDate    DateTime?
  purchasePrice Decimal  @db.Decimal(10, 2)
  stock         Int      @default(0)
  weightKg      Decimal? @db.Decimal(10, 2)
  receivedAt    DateTime @default(now())
  ledgerEntries StockLedger[] // back-relation of StockLedger.batch (FIX 2026-09-17 — was missing)

  @@unique([productId, batchNumber])
  @@index([productId])
  @@index([expiryDate])
  @@map("product_batches")
}

model StockLedger {
  id         String           @id @default(cuid())
  productId  String
  product    Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  batchId    String?
  batch      ProductBatch?    @relation(fields: [batchId], references: [id], onDelete: SetNull) // FIX 2026-09-17 — was bare String? with no relation
  type       StockLedgerType
  qtyDelta   Int
  stockAfter Int
  refId      String?
  createdBy  String?
  createdAt  DateTime         @default(now())

  @@index([productId, createdAt])
  @@index([batchId])
  @@map("stock_ledger")
}
```

- Stock = `sum(ProductBatch.stock)` (maintained + reconciled via ledger). **Decision: negative stock ALLOWED** (owner 2026-09-17) — no `CHECK stock >= 0` constraint; `stockAfter` may go negative on SALE.
- Derived `status` (In Stock / Low / Critical / Near Expiry / Expired) is computed in service from `stock vs minStock` + `expiryDate`, not stored.
- Stubs (separate plans, not this file): `Vendor, Purchase + PurchaseItem, Sale + SaleItem, Payment`.

Note: frontend `productStore.ts` + POS will need batch-aware mapping (e.g. sell oldest-expiry-first). Migration creates 1 `OPENING` batch per existing product.

### 3.9 Enums (added 2026-09-17, owner-provided)

`MedicineForm` (dosage form, on `MedicineDetails.form`): TABLET, CAPSULE, SYRUP, INJECTION, CREAM, OINTMENT, POWDER, DROPS, SUSPENSION, SOLUTION, OTHER.

`ProductUnit` (sale unit, on `Product.unit`): PIECE, STRIP, BOTTLE, BOX, VIAL, AMPOULE, TUBE, SACHET, BAG, KG, LITER, OTHER.

Mapping notes: frontend `PRODUCT_UNITS` (Box/Bottle/Piece/Strip/Tablet-Strip) maps into `ProductUnit`; frontend `PRODUCT_CATEGORIES` (Analgesic/Antibiotic/...) stay as `Category` rows under `MEDICINE`. Feed sale uses `BAG`; `KG`/`LITER` reserved for future loose sale (currently bag-only, decided).

---

## 4. Plan (Option B — still no code in this file)

### Phase P0 — Decide remaining open questions (§5)

### Phase P1 — Schema migration (Option B-hybrid)

1. Create `ProductType / MedicineForm / ProductUnit` enums, `Category(productType)`, extend `Product(productType, unit→ProductUnit)`, create `MedicineDetails(form)`, `FeedDetails`, `ProductBatch`, `StockLedger` (+ `StockLedgerType` enum) in one migration. **Split files (2026-09-17): `prisma/schema/base.prisma` (generator+datasource), `user.prisma`, `catalog.prisma` (Category/Product/details+enums), `inventory.prisma` (ProductBatch/StockLedger) — `prisma.config.ts: schema: 'prisma/schema'`. FIX: `StockLedger.batch ↔ ProductBatch.ledgerEntries` with `onDelete: SetNull` + `@@index([batchId])` (was missing).**
2. Data migration: `price → sellingPrice`; backfill `purchasePrice = sellingPrice` + flag for recount; create `Uncategorized` MEDICINE + FEED categories + assign existing rows as MEDICINE; backfill `unit=PIECE`. **v1 scope (decided 2026-09-17): `sku, barcode, manufacturer` on Product + `genericName, form` on MedicineDetails** (already in §3.8 schema).
3. Migrate existing rows: 1 batch per product (`batchNumber='OPENING'`, `expiryDate=NULL`, `stock` carried over) + `MedicineDetails` row per existing product.
4. Backfill ledger with `OPENING` entries.
5. Regenerate client (`pnpm db:generate`).

### Phase P2 — Backend contract (separate tasks, not in this file)

- Update `product.validation.ts` (Zod): require `productType, categoryId, unit (ProductUnit enum), purchasePrice, sellingPrice, minStock`; `form (MedicineForm enum, medicine-only, optional)`; `vatPercent 0–100` **per-product (decided 2026-09-17 — no shop-level default in v1)**; type checks: MEDICINE → `batchNumber` required + `category.productType=MEDICINE` + `MedicineDetails`; FEED → `batchNumber` optional + `expiryDate` required + `category.productType=FEED` + `FeedDetails`; `expiryDate` future-or-null rule TBD (pending §5 Q3).
- Update `product.interface.ts` / `service.ts`: `purchasePrice` stripped for `salesman/counter` role responses (middleware already supports `auth(...roles)`).
- Extend `ProductSearchableFields` to `['name','description','sku','barcode','manufacturer']` + medicine `genericName` via relation.
- Query filters: `?productType=&category=&stockStatus=&expiry=` to match separate Medicine/Feed menus + `ProductListFilters`.
- Derived `status` (In Stock / Low / Critical / Near Expiry / Expired) computed in service, not stored — thresholds (`CRITICAL_STOCK_RATIO`, near-expiry window days) from `client/src/features/products/utils/productStatus.ts` need backend confirmation.

### Phase P3 — Verify

- `pnpm db:generate && pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm test && pnpm build`
- Manual: create product with purchase+selling price → check salesman response hides purchasePrice → check low-stock/expiry queries → check POS totals math with VAT.

---

## 5. Open questions (blocking P1)

- [x] **Q1 identifiers — DECIDED 2026-09-17: include in v1** (`sku, barcode, manufacturer` on Product + `genericName` on MedicineDetails, all optional, already in §3.8 schema). Needed for `Sales Report filter by Manufacturer` + POS generic search.
- [ ] **Q2 Costing method — PENDING:** last purchase price vs moving average vs FIFO (per batch)? Decides Stock Value + Profit Report math.
- [ ] **Q3 Expiry threshold — PENDING:** Near Expiry window = 30/60/90 days? Critical stock ratio = ? (frontend has `CRITICAL_STOCK_RATIO` — confirm value).
- [x] **Q4 Negative stock — DECIDED 2026-09-17: ALLOW** (no CHECK constraint; `stockAfter` may go negative).
- [x] **Q5 VAT default — DECIDED 2026-09-17: per-product only** (`vatPercent @default(0)` on Product; no shop-level default in v1).
- [x] **Q6 Feed business rules — DECIDED 2026-09-17:** sale bag-only (stock in bags); each pack size (25kg/50kg) = separate Product row; expiry required for feed; batch optional for feed. Extra spec fields (`targetSpecies, feedType, proteinPct, nominalPackKg`) kept nullable — owner "not sure", confirm values later.
- [ ] **Q7 Feed `weightKg` per lot — PENDING:** mandatory (every feed purchase must record actual weight) or optional (record when available)?
- [ ] **Q8 Medicine `strength / requiresPrescription` — PENDING:** include `strength + prescription flag` in v1 or defer?

---

## 6. Acceptance criteria for this plan file

- [x] Current vs required fields documented with file:line refs
- [x] Option A removed; Option B-hybrid chosen (unified Product + MedicineDetails/FeedDetails, Category table with productType, no enum)
- [x] Q1 (v1 fields), Q4 (negative allow), Q5 (VAT per-product), Q6 (feed bag-only/pack-size/expiry-required/batch-optional) decided
- [ ] Q2 (costing), Q3 (expiry threshold), Q7 (weightKg mandatory?), Q8 (strength/prescription) pending — P1 proceeds with defaults, refinable later
- [x] Follow-up migration executed 2026-09-17: `0002_product_erp` (price→selling/purchase backfill, stock→OPENING batches+ledger, Uncategorized categories)
- [x] StockLedger↔ProductBatch FIX applied 2026-09-17: `batch @relation(SetNull)` + `ledgerEntries` back-relation + `@@index([batchId])` (§3.6–§3.8, `inventory.prisma`, migration FK `stock_ledger_batchId_fkey`)
- [x] Split schema implemented 2026-09-17: `prisma/schema/{base,user,catalog,inventory}.prisma` (`prisma.config.ts: schema: 'prisma/schema'`), monolith `schema.prisma` removed

### Feed flow example (bag-only, decided)

- Purchase: `ACI Layer 25kg` 100 bag @ ৳1850/bag, lot actual 2480kg → `ProductBatch { batchNumber: LOT-11 (optional), stock: 100, weightKg: 2480 }` + ledger `PURCHASE +100`
- Sale: 5 bag → `SALE -5`, stock 95 (price per bag; kg info-only)
- New pack size: `ACI Layer 50kg` = new `Product` + `FeedDetails{nominalPackKg: 50}`
