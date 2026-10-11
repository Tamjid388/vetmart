# VetMart — Software Requirements Specification (SRS)

**Version:** 0.5
**Date:** 2026-09-21
**Source:** `client/prd.md` v0.4 (SRS is source of truth) + POS sale decision 2026-09-18 + cookie-auth decision 2026-09-18 + Purchase module decision 2026-09-19 (Sections 4.12, 4.13, Rules 20–22) + Audit Trail decision 2026-09-21 (Section 4.15, Rule 23)
**Scope:** Backend technical specification. No code changes in this document.
**Stack:** Express 5 + TypeScript 5 + PostgreSQL + Prisma 7 (split schema in `server/prisma/schema/`), Zod validation, JWT (HttpOnly cookie-based), modular pattern (`routes -> controller -> service -> prisma`).
**Brand:** The production product name is **BagherHat Poultry (বাগেরহাট পোল্ট্রি)**. `VetMart` is the development codename only (repo/folder names, asset filenames, seed emails, log prefixes) and must never appear in user-facing UI.

---

## 1. Roles and Auth Scope

Only internal staff have login accounts. Customers and Suppliers never log in.

| Role | Description | Default | Access summary |
|------|-------------|---------|----------------|
| `admin` | Pharmacy Owner / Super Admin | No | Full control: products, purchases, sales, customers, suppliers, payments, Reports Console, Audit Trail, settings, user management |
| `staff` | Salesman / Counter staff | **Yes** | POS sales, customer/supplier lookup and create, cash/due collection, product search (stock qty only, no purchase cost / profit). No Reports Console, no user management |

Rules:

- `UserRole` enum contains exactly `admin` and `staff`. Default on create is `staff`.
- Public self-registration must not allow role self-assignment. Staff/admin accounts are created by an existing admin (or seeded).
- Auth transport — DECIDED 2026-09-18: HttpOnly cookies (no localStorage tokens). `login`/`register` set `accessToken` + `refreshToken` cookies; `refresh-token` reads the refresh cookie and rotates it; `logout` clears both. Cookies: `HttpOnly`, `Secure` in production only, `SameSite=Lax`, `Path=/`, `maxAge` matching JWT expiry. Frontend sends `withCredentials: true` and stores no token. During a one-release transition the server may still accept `Authorization: Bearer` as fallback, then the fallback is removed.
- Passwords are bcrypt-hashed. API responses never include `password` or tokens in body (post-transition).
- Soft delete on `User` (`isDeleted`). Deleted users cannot log in or refresh tokens.
- `Customer` and `Supplier` have no password, no JWT, no role, and no FK to `User`.

> Current code state (for implementers, not part of spec): `server/prisma/schema/user.prisma` still has `admin|vendor|customer` with default `customer` and `Customer.userId -> User`; auth is still header-only Bearer with tokens in JSON body and `localStorage` on the frontend (`client/src/lib/axios/axios.ts`). E1 migrates all of this to the spec below. No code change is made by this document.

---

## 2. Database Models Overview

Target model set. Status column marks what exists in code vs what the spec requires.

| # | Model | Table | Purpose | Status |
|---|-------|-------|---------|--------|
| 1 | User | `users` | Staff auth accounts only | Implemented (needs role migration) |
| 2 | Customer | `customers` | Sales-ledger master: who we sell to, receivable tracking | Implemented (needs decoupling migration) |
| 3 | Supplier | `suppliers` | Purchase-ledger master: who we buy from, payable tracking | Planned (new) |
| 4 | Category | `categories` | Product taxonomy, scoped by `productType` | Implemented |
| 5 | Product | `products` | Unified sellable base for MEDICINE and FEED | Implemented |
| 6 | MedicineDetails | `medicine_details` | Medicine-only extension of Product (1-1) | Implemented |
| 7 | FeedDetails | `feed_details` | Feed-only extension of Product (1-1) | Implemented |
| 8 | ProductBatch | `product_batches` | Per-purchase-lot stock (batch, expiry, lot cost) | Implemented |
| 9 | StockLedger | `stock_ledger` | Immutable audit of every stock movement | Implemented |
| 10 | Sale | `sales` | One row per POS transaction (header + totals) | Implemented (Section 4.10) |
| 11 | SaleItem | `sale_items` | One row per cart line (product + qty + price snapshots) | Implemented (Section 4.11) |
| 12 | Purchase | `purchases` | One row per supplier GRN (header + totals) | Specified (Section 4.12) |
| 13 | PurchaseItem | `purchase_items` | One row per GRN line, linked to the created lot | Specified (Section 4.13) |

Future modules (out of scope for this SRS version): none — `Payment` implemented (E5); `Purchase`/`PurchaseItem` specified below (E6). Audit Trail implemented (E9) as a read-only observer over existing tables; it adds no new model (Section 4.15).

---

## 3. Relation Matrix

One table showing how each model relates to others.

| Model | Relation | Target | Cardinality | Delete behavior | Notes |
|-------|----------|--------|-------------|-----------------|-------|
| User | — | — | — | — | Standalone. Sale.soldBy points at User but no back-relation required |
| Customer | `sales` | Sale | 1 -> N | Restrict (service-guarded) | Sale.customerId required; deleting a customer with sales is blocked |
| Supplier | `purchases` | Purchase | 1 -> N | Restrict (service-guarded) | Purchase.supplierId required; deleting a supplier with purchases is blocked |
| Purchase | `supplier` | Supplier | N -> 1 | Restrict | Required FK; no anonymous GRN (Rule 20) |
| Purchase | `items` | PurchaseItem | 1 -> N | Cascade (child side) | GRN lines; deleted with purchase header |
| Purchase | `receivedByUser` | User | N -> 1 | Restrict | Admin who recorded the GRN; `receivedBy` stores User.id |
| PurchaseItem | `purchase` | Purchase | N -> 1 | Cascade | Parent GRN |
| PurchaseItem | `product` | Product | N -> 1 | Restrict | Received product; cost snapshot stored so later price edits do not rewrite history |
| PurchaseItem | `batch` | ProductBatch | N -> 0/1 | SetNull | Lot created (or merged) by this GRN line; null only if the lot was later deleted |
| Category | `products` | Product | 1 -> N | Restrict (service-guarded) | `@@unique([productType, name])` |
| Product | `category` | Category | N -> 1 | Restrict (service-guarded) | `categoryId` must match `productType` (service check) |
| Product | `medicineDetails` | MedicineDetails | 1 -> 0/1 | Cascade (child side) | Required iff `productType = MEDICINE` |
| Product | `feedDetails` | FeedDetails | 1 -> 0/1 | Cascade (child side) | Required iff `productType = FEED` |
| Product | `batches` | ProductBatch | 1 -> N | Cascade (child side) | Stock = `sum(batches.stock)` |
| Product | `ledger` | StockLedger | 1 -> N | Cascade (child side) | Audit trail per product |
| MedicineDetails | `product` | Product | 1 -> 1 (PK=FK) | Cascade | `productId` is both PK and FK |
| FeedDetails | `product` | Product | 1 -> 1 (PK=FK) | Cascade | `productId` is both PK and FK |
| ProductBatch | `product` | Product | N -> 1 | Cascade | Parent product |
| ProductBatch | `ledgerEntries` | StockLedger | 1 -> N | SetNull (child side) | Back-relation of `StockLedger.batch` |
| StockLedger | `product` | Product | N -> 1 | Cascade | Which product moved |
| StockLedger | `batch` | ProductBatch | N -> 0/1 | SetNull | Which lot moved; null allowed. Invariant: if `batchId` set, `productId` must equal `batch.productId` (service-enforced) |
| Sale | `customer` | Customer | N -> 1 | Restrict | Required FK; no anonymous sale (Rule 9) |
| Sale | `items` | SaleItem | 1 -> N | Cascade (child side) | Cart lines; deleted with sale header |
| Sale | `soldByUser` | User | N -> 1 | Restrict | Staff who completed the sale; `soldBy` stores User.id |
| SaleItem | `sale` | Sale | N -> 1 | Cascade | Parent transaction |
| SaleItem | `product` | Product | N -> 1 | Restrict | Sold product; price snapshots stored so later price edits do not rewrite history |
| SaleItem | `batch` | ProductBatch | N -> 0/1 | SetNull | Lot deducted (FIFO oldest-expiry-first); null only if sale was a master adjustment |

Design decisions:

- Auth (`User`) is fully decoupled from business ledgers (`Customer`, `Supplier`). No shared table, no polymorphic `Party` table.
- `Customer` and `Supplier` are separate tables because fields diverge (receivable vs payable) and downstream relations diverge (Sale vs Purchase).
- `Product` is a unified base; MEDICINE vs FEED split lives in `productType` + extension tables, not in separate base tables. All purchase/sale/ledger FKs point at `Product`.
- `StockLedger` is append-only audit. Deleting a `ProductBatch` nulls `StockLedger.batchId` but keeps the row.

---

## 4. Model Field Specifications

Conventions: `PK` = primary key, `FK` = foreign key, `UQ` = unique. Money uses `Decimal(10,2)` or `Decimal(12,2)`; percent uses `Decimal(5,2)`. All models use `cuid()` string IDs unless noted.

### 4.1 User (`users`) — auth only

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `email` | String | UQ, required | Login identity |
| `password` | String | required, bcrypt hash | Never returned by API |
| `name` | String? | optional | Staff display name |
| `role` | UserRole | required, default `staff` | Enum: `admin`, `staff` |
| `isDeleted` | Boolean | default `false` | Soft delete; excluded from all queries and auth |
| `createdAt` | DateTime | auto `now()` | — |
| `updatedAt` | DateTime | auto `@updatedAt` | — |

No relations.

### 4.2 Customer (`customers`) — non-login sales master

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | Display as `#CUST-xxxx` in UI (formatting only) |
| `name` | String | required | Customer / farm name |
| `phone` | String | UQ, required | Primary lookup key at POS; unique to prevent duplicate dues |
| `address` | String? | optional | — |
| `area` | String? | optional, stored lowercase canonical (trim + single-space + `toLowerCase`) | Free-text, rural-proof (no hardcoded list). No separate area-filter dropdown — area is covered by global customer search (`name`/`phone`/`area`, insensitive contains). Form uses AutoComplete with DB-driven suggestions (`GET /customers/areas` distinct); new (unlisted) area needs explicit confirm. Display Title Case via `formatArea()`; storage stays lowercase for exact-match filtering |
| `category` | String? | optional | PRD requirement: Regular / Wholesale; drives optional discount note |
| `dueBalance` | Decimal(12,2) | default `0` | Total receivable; updated by Sale and Payment transactions |
| `isActive` | Boolean | default `true` | Disable without deleting |
| `isDeleted` | Boolean | default `false` | Soft delete |
| `createdAt` | DateTime | auto `now()` | — |
| `updatedAt` | DateTime | auto `@updatedAt` | — |

No FK to `User`. Relations: `Sale.customerId -> Customer.id` (1 Customer -> N Sales).

### 4.3 Supplier (`suppliers`) — non-login purchase master [PLANNED]

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | Display as `#SUP-xxxx` in UI (formatting only) |
| `companyName` | String | required | Distributor / mill name |
| `contactPerson` | String? | optional | — |
| `phone` | String | UQ, required | Primary lookup key |
| `address` | String? | optional | — |
| `tradeLicense` | String? | optional | — |
| `paymentTerms` | Int? | optional, days | e.g. 30 = net-30 |
| `payableBalance` | Decimal(12,2) | default `0` | Total payable; updated by Purchase and Payment transactions |
| `isActive` | Boolean | default `true` | — |
| `isDeleted` | Boolean | default `false` | Soft delete |
| `createdAt` | DateTime | auto `now()` | — |
| `updatedAt` | DateTime | auto `@updatedAt` | — |

No FK to `User`. Relations: `Purchase.supplierId -> Supplier.id` (1 Supplier -> N Purchases).

### 4.4 Category (`categories`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `productType` | ProductType | required, indexed | `MEDICINE` or `FEED`; scopes menus and validation |
| `name` | String | required | e.g. MEDICINE: Antibiotic, Vitamin; FEED: Layer, Broiler |
| `isActive` | Boolean | default `true` | Hide without deleting |
| `createdAt` | DateTime | auto `now()` | — |
| `updatedAt` | DateTime | auto `@updatedAt` | — |
| `products` | Product[] | relation 1-N | — |

Constraints: `@@unique([productType, name])`, `@@index([productType])`.

### 4.5 Product (`products`) — unified base

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `productType` | ProductType | required, indexed | Discriminator: decides which extension row is required |
| `sku` | String? | UQ, optional | POS search, barcode placeholder |
| `name` | String | required | Feed: include pack size, e.g. `ACI Layer 25kg` (each pack size = separate row) |
| `description` | String? | optional | Composition |
| `categoryId` | String | FK -> Category, indexed | Must satisfy `category.productType == product.productType` (service check) |
| `unit` | ProductUnit | required | Sale unit. Medicine: PIECE/STRIP/BOTTLE/VIAL/AMPOULE/TUBE/SACHET; Feed: BAG (bag-only sale) |
| `purchasePrice` | Decimal(10,2) | required | Per sale unit. Sensitive: hidden from `staff` responses |
| `sellingPrice` | Decimal(10,2) | required | Per sale unit |
| `minStock` | Int | default `0` | Sale units; low-stock alert threshold |
| `vatPercent` | Decimal(5,2) | default `0` | Per-product VAT only; no shop-level default in v1 |
| `manufacturer` | String? | optional | Medicine company / feed mill; report filter |
| `barcode` | String? | UQ, optional | Placeholder for future scanner |
| `imageUrl` | String? | optional | Future upload |
| `isActive` | Boolean | default `true` | Disable without deleting |
| `isDeleted` | Boolean | default `false` | Soft delete |
| `createdAt` / `updatedAt` | DateTime | auto | — |
| `medicineDetails` | MedicineDetails? | 1-1 | Required iff MEDICINE |
| `feedDetails` | FeedDetails? | 1-1 | Required iff FEED |
| `batches` | ProductBatch[] | 1-N | — |
| `ledger` | StockLedger[] | 1-N | — |

Indexes: `@@index([productType])`, `@@index([categoryId])`.

### 4.6 MedicineDetails (`medicine_details`)

PK=FK pattern: `productId` is both primary key and FK to Product with cascade delete. One row per MEDICINE product.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `productId` | String | PK + FK -> Product, cascade | — |
| `form` | MedicineForm? | optional | TABLET / CAPSULE / SYRUP / INJECTION / CREAM / OINTMENT / POWDER / DROPS / SUSPENSION / SOLUTION / OTHER |
| `genericName` | String? | optional | POS search by generic |
| `strength` | String? | optional | e.g. 500mg |
| `requiresPrescription` | Boolean | default `false` | — |

### 4.7 FeedDetails (`feed_details`)

PK=FK pattern, one row per FEED product.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `productId` | String | PK + FK -> Product, cascade | — |
| `targetSpecies` | String? | optional | chicken / cow / fish |
| `feedType` | String? | optional | Layer / Broiler / Dairy / Fish |
| `proteinPct` | Decimal(5,2)? | optional | e.g. 18.50 |
| `nominalPackKg` | Decimal(8,2)? | optional | Label pack size, e.g. 25 / 50 |

### 4.8 ProductBatch (`product_batches`) — one row per purchase lot

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `productId` | String | FK -> Product, cascade, indexed | Parent product |
| `batchNumber` | String? | optional | Medicine: required. Feed: optional. `@@unique([productId, batchNumber])` (PG allows multiple NULLs) |
| `expiryDate` | DateTime? | optional, indexed | Required for both types per owner decision; drives Near Expiry / Expired |
| `purchasePrice` | Decimal(10,2) | required | This lot's cost per sale unit (FIFO support) |
| `stock` | Int | default `0` | This lot's qty in sale units. Product stock = sum of lots |
| `weightKg` | Decimal(10,2)? | optional — DECIDED 2026-09-18: always optional | Feed-only info field: actual lot weight (e.g. 25kg bag arrives 24.8kg). Never required, never blocks purchase entry |
| `receivedAt` | DateTime | default `now()` | Lot receipt date |
| `ledgerEntries` | StockLedger[] | 1-N back-relation | — |

Constraints: `@@unique([productId, batchNumber])`, `@@index([productId])`, `@@index([expiryDate])`.

Lot identity — DECIDED 2026-09-19: same non-null `(productId, batchNumber)` = same physical lot. A GRN line with an already-existing `(productId, batchNumber)` merges stock into that lot (`stock += qty`, new `PURCHASE` ledger row) instead of creating a duplicate. Null `batchNumber` always creates a new lot.

### 4.9 StockLedger (`stock_ledger`) — append-only audit

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `productId` | String | FK -> Product, cascade | Which product moved; `@@index([productId, createdAt])` |
| `batchId` | String? | FK -> ProductBatch, SetNull, indexed | Which lot moved; null for master adjustments; preserves history on lot delete |
| `type` | StockLedgerType | required | PURCHASE / SALE / ADJUSTMENT / RETURN / OPENING |
| `qtyDelta` | Int | required, signed | e.g. `+50` purchase, `-2` sale |
| `stockAfter` | Int | required | Balance after move; may go negative (allowed per owner decision) |
| `refId` | String? | optional | Future Purchase/Sale invoice id |
| `createdBy` | String? | optional | Future User id |
| `createdAt` | DateTime | default `now()` | — |

Constraints: `@@index([productId, createdAt])`, `@@index([batchId])`.

`refId` convention for sales: `StockLedger.refId = Sale.id` and `type = SALE` for every deduction created by a POS transaction.

### 4.10 Sale (`sales`) — one row per POS transaction [PLANNED]

Header + totals. Lines live in `SaleItem` (Section 4.11).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | `refId` target for `StockLedger` rows of this sale |
| `invoiceNo` | String | UQ, required | Human invoice id, e.g. `#SALE-00001`. Generated server-side from a serialized counter (date-prefix + counter allowed). `@@unique` + retry on P2002 collision under concurrency (Rule 14) |
| `idempotencyKey` | String | UQ, required | Client-generated UUID per checkout attempt. Retry with the same key returns the existing sale instead of creating a duplicate (Rule 12) |
| `customerId` | String | FK -> Customer, required, indexed | Required per Rule 9. Staff must create customer first via `POST /customers` |
| `saleDate` | DateTime | default `now()`, indexed | Transaction date; filters for Reports and dashboard |
| `subtotal` | Decimal(12,2) | required | Sum of `SaleItem.lineTotal` before discount and VAT |
| `discount` | Decimal(12,2) | default `0` | Flat discount for the whole sale |
| `vatTotal` | Decimal(12,2) | default `0` | Sum of per-line VAT computed from `SaleItem.vatPercent` snapshots |
| `grandTotal` | Decimal(12,2) | required | `subtotal - discount + vatTotal` (service-computed, never trusted from client) |
| `paidAmount` | Decimal(12,2) | required | Collected at POS. Must satisfy `0 <= paidAmount <= grandTotal` (Rule 15). Overpay / change-due is not supported in v1 |
| `dueAmount` | Decimal(12,2) | default `0` | `grandTotal - paidAmount`; added to `Customer.dueBalance` in the same transaction |
| `paymentMethod` | SalePaymentMethod? | optional (nullable) | Required when `paidAmount > 0`. Must be null when `paidAmount = 0` (pure DUE sale has no instant method). Single method per sale in v1 — split payments not supported (Rule 17) |
| `paymentStatus` | SalePaymentStatus | required, indexed | `PAID` (`dueAmount = 0`), `PARTIAL` (`0 < dueAmount < grandTotal`), `DUE` (`paidAmount = 0`) |
| `soldBy` | String | FK -> User, required, indexed | `User.id` of staff who completed the sale |
| `notes` | String? | optional | Counter note |
| `isDeleted` | Boolean | default `false` | Soft delete (void). Voiding must reverse ledger + due via compensating entries, never hard-delete |
| `createdAt` | DateTime | auto `now()` | — |
| `updatedAt` | DateTime | auto `@updatedAt` | — |
| `customer` | Customer | N-1 relation | — |
| `items` | SaleItem[] | 1-N relation | Cascade delete with header |
| `soldByUser` | User | N-1 relation | — |

Constraints: `@@unique([invoiceNo])`, `@@unique([idempotencyKey])`, `@@index([customerId])`, `@@index([saleDate])`, `@@index([paymentStatus])`, `@@index([soldBy])`.

### 4.11 SaleItem (`sale_items`) — one row per cart line [PLANNED]

Immutable snapshot: prices are copied at sale time so later product price edits do not rewrite history.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `saleId` | String | FK -> Sale, cascade, indexed | Parent transaction; `@@index([saleId])` |
| `productId` | String | FK -> Product, restrict, indexed | Sold product |
| `batchId` | String? | FK -> ProductBatch, SetNull | Lot actually deducted (FIFO oldest-expiry-first). Preserves audit if lot is later deleted |
| `qty` | Int | required, positive | Sale qty in sale units (bags / strips / pieces) |
| `sellingPrice` | Decimal(10,2) | required | Snapshot of `Product.sellingPrice` at sale time |
| `purchasePrice` | Decimal(10,2) | required | Snapshot of lot `ProductBatch.purchasePrice` at sale time. Admin-only; never returned to `staff`; basis for future profit report (GAP-1) |
| `vatPercent` | Decimal(5,2) | default `0` | Snapshot of `Product.vatPercent` at sale time |
| `lineTotal` | Decimal(12,2) | required | `qty * sellingPrice` (service-computed) |
| `sale` | Sale | N-1 relation | — |
| `product` | Product | N-1 relation | Restrict: product with sales cannot be hard-deleted |
| `batch` | ProductBatch? | N-1 relation | SetNull on lot delete |

Constraints: `@@index([saleId])`, `@@index([productId])`, `@@index([batchId])`.

### 4.12 Purchase (`purchases`) — one row per supplier GRN

Header + totals. Lines live in `PurchaseItem` (Section 4.13). Each line creates (or merges into) exactly one `ProductBatch` lot — this is the only post-creation stock-in path ( Rule 20). The product-create `initialBatch` (Rule 5) remains for opening stock only.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | `refId` target for `StockLedger` rows of this GRN |
| `invoiceNo` | String | UQ, required | Human GRN id, e.g. `PR-00001`. Generated server-side from a serialized counter (`purchase_counter`). `@@unique` + retry on P2002 collision under concurrency (Rule 21) |
| `idempotencyKey` | String | UQ, required | Client-generated UUID per GRN attempt. Retry with the same key returns the existing purchase instead of creating a duplicate (Rule 21) |
| `supplierId` | String | FK -> Supplier, required, indexed | Required per Rule 20. No anonymous GRN |
| `purchaseDate` | DateTime | default `now()`, indexed | GRN date; filters for Reports and dashboard |
| `subtotal` | Decimal(12,2) | required | Sum of `PurchaseItem.lineTotal` before discount and VAT |
| `discount` | Decimal(12,2) | default `0` | Flat discount for the whole GRN (supplier-given) |
| `vatTotal` | Decimal(12,2) | default `0` | Sum of per-line VAT computed from `PurchaseItem.vatPercent` snapshots |
| `grandTotal` | Decimal(12,2) | required | `subtotal - discount + vatTotal` (service-computed, never trusted from client) |
| `paidAmount` | Decimal(12,2) | required | Paid to supplier at receipt. Must satisfy `0 <= paidAmount <= grandTotal` (Rule 20). Overpay is not supported in v1 |
| `dueAmount` | Decimal(12,2) | default `0` | `grandTotal - paidAmount`; added to `Supplier.payableBalance` in the same transaction |
| `paymentMethod` | SalePaymentMethod? | optional (nullable) | Reuses the sale payment-method enum (`CASH`, `BKASH`, `NAGAD`, `CARD`). Required when `paidAmount > 0`. Must be null when `paidAmount = 0` (pure credit GRN has no instant method). Single method per GRN in v1 |
| `paymentStatus` | SalePaymentStatus | required, indexed | Reuses the sale status enum: `PAID` (`dueAmount = 0`), `PARTIAL` (`0 < dueAmount < grandTotal`), `DUE` (`paidAmount = 0`) |
| `receivedBy` | String | FK -> User, required, indexed | `User.id` of admin who recorded the GRN |
| `notes` | String? | optional | Supplier invoice / challan reference |
| `isDeleted` | Boolean | default `false` | Soft delete (void). Voiding must reverse lots + payable via compensating entries, never hard-delete |
| `createdAt` | DateTime | auto `now()` | — |
| `updatedAt` | DateTime | auto `@updatedAt` | — |
| `supplier` | Supplier | N-1 relation | — |
| `items` | PurchaseItem[] | 1-N relation | Cascade delete with header |
| `receivedByUser` | User | N-1 relation | — |

Constraints: `@@unique([invoiceNo])`, `@@unique([idempotencyKey])`, `@@index([supplierId])`, `@@index([purchaseDate])`, `@@index([paymentStatus])`, `@@index([receivedBy])`.

### 4.13 PurchaseItem (`purchase_items`) — one row per GRN line

Immutable snapshot: lot cost is copied at receipt time so later product price edits do not rewrite history. One item creates (or merges into) exactly one lot.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | String | PK, `cuid()` | — |
| `purchaseId` | String | FK -> Purchase, cascade, indexed | Parent GRN; `@@index([purchaseId])` |
| `productId` | String | FK -> Product, restrict, indexed | Received product (must be active, not deleted) |
| `batchId` | String? | FK -> ProductBatch, SetNull | Lot created/merged by this line. Preserves audit if lot is later deleted |
| `qty` | Int | required, positive | Received qty in sale units (bags / strips / pieces) |
| `purchasePrice` | Decimal(10,2) | required | Lot cost per sale unit for this GRN line (`>= 0`; `0` allowed for free goods). Written onto the created/merged lot; admin-only in responses |
| `sellingPrice` | Decimal(10,2) | required | Snapshot of `Product.sellingPrice` at receipt time (margin reference only) |
| `vatPercent` | Decimal(5,2) | default `0` | Snapshot of `Product.vatPercent` at receipt time |
| `lineTotal` | Decimal(12,2) | required | `qty * purchasePrice` (service-computed) |
| `batchNumber` | String? | optional | Written onto the created lot. Same merge rule as 4.8: same non-null `(productId, batchNumber)` = same physical lot → stock merges |
| `expiryDate` | DateTime? | required per line | Written onto the created lot (same owner rule as product create: expiry required for both types) |
| `weightKg` | Decimal(10,2)? | optional | Written onto the created lot (feed info only, never blocks entry) |
| `purchase` | Purchase | N-1 relation | — |
| `product` | Product | N-1 relation | Restrict: product with purchases cannot be hard-deleted |
| `batch` | ProductBatch? | N-1 relation | SetNull on lot delete |

Constraints: `@@index([purchaseId])`, `@@index([productId])`, `@@index([batchId])`.

### 4.14 Vendor payment extension (`payments`) — E6 addition

Customer-side `Payment` (E5/GAP-2) is unchanged. For vendor dues, the same table carries supplier-side rows:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `supplierId` | String? | FK -> Supplier, Restrict, indexed, nullable | Set for vendor payments; null for customer collections |
| `purchaseId` | String? | FK -> Purchase, SetNull, indexed, nullable | Optional link to the GRN being paid off (informational, like `saleId`) |

Rules: exactly one side per row — `customerId` XOR `supplierId` (service check, `400` otherwise). `saleId` only with `customerId`; `purchaseId` only with `supplierId`, and the linked GRN must belong to the same supplier (`400` otherwise). Vendor collection: `0 < amount <= Supplier.payableBalance` else `400`; transaction creates the payment + `Supplier.payableBalance -= amount`. `GET /payments?supplierId=` for vendor history. Role gate `auth('admin','staff')` (payable totals visible to staff on the vendor row only — no lot-cost fields involved).

### 4.15 Audit Trail (`audits`) — read-only observer, NO new model [IMPLEMENTED E9]

No new table, no new columns, no writes. The audits module (`server/src/app/modules/audits/`, mounted at `/api/v1/audits`) projects already-stored rows into a unified timeline for admin review. Frontend: `/audits` route behind `RequireAdmin`, sidebar `অডিট (Audit)` with `ADMIN_ONLY` (staff never sees it; direct hits get `403`).

Event sources — each maps 1:1 to an existing table; `action` is derived only from existing columns:

| Module | Source table | Actions | Actor source (existing FK/column) | Event time (existing column) |
|--------|--------------|---------|-----------------------------------|------------------------------|
| `sale` | `sales` | `created` (`isDeleted = false`), `voided` (`isDeleted = true`, Rule 19) | `soldBy` → `soldByUser` | `createdAt` / `updatedAt` |
| `purchase` | `purchases` | `created` (`isDeleted = false`), `voided` (`isDeleted = true`, Rule 22) | `receivedBy` → `receivedByUser` | `createdAt` / `updatedAt` |
| `payment` | `payments` | `collected` | `collectedBy` → `collectedByUser` | `paidAt` |
| `stock` | `stock_ledger` | `movement` (one event per row, `type` = OPENING / PURCHASE / SALE / RETURN) | `createdBy` (plain string id, no FK — resolved by lookup, null when absent) | `createdAt` |
| `user` | `users` | `created` (`isDeleted = false`), `deactivated` (`isDeleted = true`) | none stored → null | `createdAt` / `updatedAt` |
| `customer` / `supplier` / `product` | `customers` / `suppliers` / `products` | `created` (`isDeleted = false`), `deactivated` (`isDeleted = true`) | none stored → null | `createdAt` / `updatedAt` |

Event shape: `{ id: "<module>:<action>:<recordId>", module, action, refNo (invoiceNo / email / name), recordId, title, summary, actor { id, name, email } | null, eventAt, severity, status, details }`. `status` echoes an existing column only (`paymentStatus`, `VOIDED`/`DEACTIVATED` from `isDeleted`, `INACTIVE` from `isActive`, ledger `type`). `details` carries existing row fields (amounts, `qtyDelta`, `stockAfter`, `stockBefore = stockAfter - qtyDelta`, method, parties, record `notes`); before/after snapshots for master edits do not exist and are not shown (GAP-5).

Endpoints (all `auth('admin')`, all GET, standard `QueryBuilder`-style `page`/`limit` envelope on lists):

- `GET /api/v1/audits/overview` — aggregate counts/sums with optional `dateFrom`/`dateTo`: sales (total, voided, grandTotal, dueTotal), purchases (same), payments (total + customer/supplier split), stock (total + by-type), users (total/admins/staff/deactivated), masters (customers/suppliers/products), top-5 actors (merged `soldBy`/`receivedBy`/`collectedBy` group-bys).
- `GET /api/v1/audits/events` — merged timeline, newest first. Filters: `searchTerm` (per-module searchable fields: sale/purchase `invoiceNo`, user `email`/`name`, customer `name`/`phone`/`area`, supplier `companyName`/`phone`/`contactPerson`, product `name`/`sku`, payment linked invoiceNos, stock `refId`/product name+sku/batch number), `module`, `action`, `userId` (actor), `dateFrom`/`dateTo` on event time, `sortOrder`.
- `GET /api/v1/audits/events/:module/:id` — the underlying record with existing relations (unknown module → `400`, missing row → `404`).

Explicitly excluded (no storage exists — UI must not show these): login/security history, approval workflow, IP/device, export/download history, field-level before/after for master edits, void/change reasons (void and soft-delete endpoints store none).

---

## 5. Enums

| Enum | Values | Used on |
|------|--------|---------|
| UserRole (target) | `admin`, `staff` | `User.role` |
| ProductType | `MEDICINE`, `FEED` | `Category.productType`, `Product.productType` |
| MedicineForm | `TABLET`, `CAPSULE`, `SYRUP`, `INJECTION`, `CREAM`, `OINTMENT`, `POWDER`, `DROPS`, `SUSPENSION`, `SOLUTION`, `OTHER` | `MedicineDetails.form` |
| ProductUnit | `PIECE`, `STRIP`, `BOTTLE`, `BOX`, `VIAL`, `AMPOULE`, `TUBE`, `SACHET`, `BAG`, `KG`, `LITER`, `OTHER` | `Product.unit` |
| StockLedgerType | `PURCHASE`, `SALE`, `ADJUSTMENT`, `RETURN`, `OPENING` | `StockLedger.type` |
| SalePaymentMethod | `CASH`, `BKASH`, `NAGAD`, `CARD` | `Sale.paymentMethod`, `Purchase.paymentMethod` (reused, 4.12), `Payment.method` |
| SalePaymentStatus | `PAID`, `PARTIAL`, `DUE` | `Sale.paymentStatus`, `Purchase.paymentStatus` (reused, 4.12) |

---

## 6. Key Business Rules (technical enforcement)

1. Role gate: `auth('admin')` for user management, Reports Console, purchase-cost/profit fields, the whole purchases module (GRN create/list/detail/void — lot costs must never reach `staff`), and the whole audits module (read-only timeline that surfaces lot costs and void trails — Section 4.15). `auth('admin','staff')` for POS, customer/supplier CRUD, vendor due collection (`POST /payments` supplier side), product catalog (qty only for staff).
2. `purchasePrice`, profit, and supplier payable fields are never returned to `staff` role responses.
3. Customer and Supplier are created by staff; phone must be unique per table to keep due/payable ledgers correct.
4. Product create must include exactly one extension: MEDICINE -> `medicineDetails`, FEED -> `feedDetails`. `category.productType` must equal `product.productType`.
5. Every product create seeds one `OPENING` batch + ledger row so `sum(batches.stock)` starts correctly.
6. Stock invariant: when `StockLedger.batchId` is set, `StockLedger.productId` must equal `batch.productId` (service/transaction check; not a DB CHECK).
7. Derived status (computed in service, never stored) — DECIDED 2026-09-18:
   - Applies to: `Product` (aggregated view) computed from `Product.minStock` + `sum(ProductBatch.stock)` for stock status, and from `ProductBatch.expiryDate` (earliest active lot) for expiry status. Source models: Section 4.5 `Product` + Section 4.8 `ProductBatch`.
   - Stock: `In Stock` when stock > minStock; `Low` when stock <= minStock; `Critical` when stock <= 40% of minStock (e.g. minStock 20 -> Critical at 8 or below). `minStock = 0` means no Low/Critical warning.
   - Expiry: `Expired` when earliest lot `expiryDate < today`; `Near Expiry` when earliest lot `expiryDate` is within 20 days from today; otherwise no expiry flag.
8. All list endpoints use soft-delete filter (`isDeleted: false`), `QueryBuilder` search/filter/sort/paginate, and uniform success/error envelopes.
9. Sale always requires a customer — DECIDED 2026-09-18. No anonymous walk-in sale. If the customer record does not exist, staff must create it first (`POST /customers`), then create the sale with `customerId`. `Sale.customerId` is required (not nullable).
10. POS Complete Sale is one atomic transaction (Sections 4.10 + 4.11 + 4.8 + 4.9 + 4.2): validate customer exists and is not deleted; validate each line (product active, qty positive); deduct `ProductBatch.stock` FIFO oldest-`expiryDate`-first (may span multiple lots, one `SaleItem` per lot consumed or one item with split ledger rows — implementers pick one and document it); create `StockLedger { type: SALE, qtyDelta: -qty, stockAfter, batchId, refId: sale.id, createdBy: soldBy }` per deduction; create `Sale` + `SaleItem` rows with server-computed totals and price snapshots; update `Customer.dueBalance += Sale.dueAmount`. Any failure rolls back everything.
11. Sale totals are server-computed: `lineTotal = qty * sellingPrice` (snapshot), `subtotal = sum(lineTotal)`, `vatTotal` from `vatPercent` snapshots, `grandTotal = subtotal - discount + vatTotal`, `dueAmount = grandTotal - paidAmount`. Client-sent totals are ignored. `paymentStatus` derives from amounts: `dueAmount = 0` -> `PAID`; `paidAmount = 0` -> `DUE`; else `PARTIAL`. VAT basis — DECIDED 2026-09-18: `sellingPrice` is VAT-exclusive, so the formula above always holds. Rounding: round each `lineTotal` and `vatTotal` to 2 decimals at the line level, then sum (documented so UI preview matches server). Prices snapshot at completion time (cart shows live prices; the receipt shows snapshot values).
12. Idempotency (mandatory v1): `POST /sales` requires `idempotencyKey` (UUID v4, client-generated per checkout attempt). Server enforces `@@unique([idempotencyKey])`. Retrying with the same key returns the original sale (`200`, no new deduction). A new checkout attempt uses a new key. Handles double-click and network retry.
13. Concurrency / oversell (mandatory for 2+ counters; recommended even for single counter): Complete Sale runs in one DB transaction with row-level locks on all touched `ProductBatch` rows (`SELECT ... FOR UPDATE` or Prisma transaction with pessimistic lock), ordered by `id` to avoid deadlocks. Stock availability is re-checked after locking (Rule 16). Concurrent checkouts for the same lot serialize; the loser gets `409 Insufficient stock` with per-line available qty.
14. Invoice numbering under concurrency (mandatory v1): `invoiceNo` comes from a serialized generator (single-row counter table or DB sequence; date-prefix allowed). `@@unique([invoiceNo])` is the backstop: on P2002 the service retries with the next value (max 3 retries, then `500`). Client never generates `invoiceNo`.
15. Amount and line guards (mandatory v1, service-validated): `qty >= 1` per line; `discount >= 0` and `discount <= subtotal + vatTotal`; `0 <= paidAmount <= grandTotal`; `dueAmount = grandTotal - paidAmount`. `paymentMethod` required iff `paidAmount > 0`, must be null iff `paidAmount = 0`. Violations -> `400`.
16. Insufficient-stock and expired-stock policy — DECIDED 2026-09-18 (mandatory v1): (a) FIFO skips `isDeleted` lots and lots with `stock <= 0`. (b) Expired lots (`expiryDate < today`) are never auto-consumed; if only expired stock remains the sale is blocked with `409 Expired stock` (staff sees earliest-expiry info). Selling an expired lot explicitly is not supported in v1. (c) If requested qty exceeds available unexpired stock, the whole sale is blocked with `409` + per-line `{ requested, available }` — no partial auto-fulfillment, no backorder. (d) Negative sale-time stock is therefore unreachable through POS; the `stockAfter may go negative` allowance in 4.9 covers only manual `ADJUSTMENT` corrections, not sales.
17. Payment and discount scope for v1 (locked): single `paymentMethod` per sale (no split Cash + bKash). Only header-level flat `discount` (no per-line discount, no automatic Wholesale-category discount, no coupon). Staff may apply discount up to a configured max (default: any amount within Rule 15; tighten later). Anything richer is out of scope for v1 and must not be assumed by the frontend.
18. Multi-lot consumption — DECIDED 2026-09-18 (mandatory v1): one `SaleItem` row per product per lot consumed. Example: 10 bags spanning lot A (6) + lot B (4) -> two `SaleItem` rows with their own `batchId`, `sellingPrice`/`purchasePrice` snapshots, and `lineTotal`. One `StockLedger SALE` row per `SaleItem` row. Keeps receipts, returns, and FIFO profit exact.
19. Returns and void, v1 scope (mandatory minimal): no sale edit, no partial-line return in v1. Only full-sale void by `admin` via soft-delete (`isDeleted = true`) plus compensating entries in the same transaction: restock each lot (`ProductBatch.stock += qty`, `StockLedger RETURN` with `refId = sale.id`), reverse `Customer.dueBalance -= sale.dueAmount`. Voiding an already-voided sale is `409`. Partial returns, restock-to-new-batch via void, and return-to-expired-lot handling are deferred (see GAP-4). Restock-to-new-batch via Purchase GRN is covered (Rule 20).
20. GRN Complete Purchase is one atomic transaction (Sections 4.12 + 4.13 + 4.8 + 4.9 + 4.3): validate supplier exists, not deleted, and active; validate each line (product exists, active, not deleted; `qty >= 1`; `purchasePrice >= 0`; `expiryDate` valid date; `weightKg` optional); merge duplicate lines for the same product + same `batchNumber` (qty sums; differing `purchasePrice` for the same lot is `400` — one lot has one cost); create/merge one `ProductBatch` per line (new lot: `purchasePrice`, `stock = qty`, `batchNumber?`, `expiryDate`, `weightKg?`, `receivedAt = now()`; merge: `stock += qty`, lot cost stays as first-written); create `StockLedger { type: PURCHASE, qtyDelta: +qty, stockAfter, batchId, refId: purchase.id, createdBy: receivedBy }` per line; create `Purchase` + `PurchaseItem` rows with server-computed totals and snapshots; update `Product.purchasePrice` to the last received lot cost per product (keeps master cost current; report costing still per GAP-1); update `Supplier.payableBalance += Purchase.dueAmount`. Any failure rolls back everything.
21. Purchase idempotency + numbering (mirror Rules 12/14): `POST /purchases` requires client-generated UUID `idempotencyKey`; retry with the same key returns the original purchase (`200`, no new lots). `invoiceNo` (`PR-00001`…) comes from a serialized `purchase_counter` generator; `@@unique([invoiceNo])` backstop with max 3 retries on P2002. Amount guards mirror Rule 15: `discount >= 0` and `discount <= subtotal + vatTotal`; `0 <= paidAmount <= grandTotal`; `paymentMethod` required iff `paidAmount > 0`, must be null iff `paidAmount = 0`. Violations -> `400`. `404` unknown supplier/product. P2002 on `(productId, batchNumber)` under concurrent GRN merge → re-read and merge once, then `500` if still racing.
22. Purchase void, v1 scope (admin only): no purchase edit, no partial-line void. Only full-purchase void by `admin` via soft-delete plus compensating entries in the same transaction: un-receive each lot (`ProductBatch.stock -= qty`, `StockLedger RETURN` with negative `qtyDelta`, `refId = purchase.id`), reverse `Supplier.payableBalance -= purchase.dueAmount`. Void is blocked with `409` if any lot's current stock is below the return qty (goods already sold — cannot un-receive sold stock) or if the purchase is already voided. Vendor payments already collected against the purchase do not block void in v1 (payable may go negative; settle manually) — must be revisited if auto-settlement is added.
23. Audit Trail is observe-only (Section 4.15, admin only): the audits module performs no writes and derives every event from already-stored columns (`createdAt` / `updatedAt` / `paidAt` / `isDeleted` / `StockLedger.type`). `severity` is a display-only tag mapping (voided/deactivated → critical; `RETURN`/`DUE`/`PARTIAL` → warning; collected/`PAID` → success; else info) and must never drive business logic. Dimensions with no stored source (login history, approvals, IP/device, export history, master field-level before/after, void/change reasons) are excluded from the UI, not fabricated (GAP-5).

---

## 7. API Surface (reference, existing + planned)

Existing (see `server/docs/architecture.md` for full contract):

- `GET /health`
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login` (set HttpOnly `accessToken` + `refreshToken` cookies, no tokens in body), `POST /api/v1/auth/refresh-token` (reads refresh cookie, rotates it), `POST /api/v1/auth/logout` (clears both cookies), `GET /api/v1/auth/me` (cookie-authenticated)
- `POST /api/v1/users` (admin — creates staff/admin accounts, no cookies set), `GET /api/v1/users`, `GET/PATCH/DELETE /api/v1/users/:id` (admin)
- `GET /api/v1/products`, `POST/PATCH/DELETE /api/v1/products[/:id]` (create/update/delete gated)
- `GET /api/v1/audits/overview`, `GET /api/v1/audits/events`, `GET /api/v1/audits/events/:module/:id` (admin only, read-only — unified timeline over existing rows, Section 4.15)

Planned (when backend implements this SRS; routes follow same module pattern):

- `GET/POST /api/v1/customers`, `GET/PATCH/DELETE /api/v1/customers/:id` (admin, staff)
- `GET/POST /api/v1/suppliers`, `GET/PATCH/DELETE /api/v1/suppliers/:id` (admin, staff; cost/payable fields admin-only in responses)
- `GET/POST /api/v1/sales`, `GET /api/v1/sales/:id` (admin, staff; `purchasePrice` snapshots and profit fields admin-only in responses). `POST /sales` body: `{ idempotencyKey, customerId, items: [{ productId, qty }], discount?, paymentMethod?, paidAmount, notes? }` — server resolves batches FIFO, computes all totals and snapshots, deducts stock, writes ledger, and updates customer due in one transaction. No `DELETE` on sales in v1 (void via `isDeleted` + compensating entries only, admin-only full void). Error contract: `400` amount/line guards, `404` unknown customer/product, `409` insufficient stock (`{ requested, available }` per line), expired stock, duplicate idempotency conflict, or already-voided.
- `POST /api/v1/sales/:id/void` (admin only, planned minimal): full-sale void per Rule 19.
- `GET/POST /api/v1/purchases`, `GET /api/v1/purchases/:id` (admin only — lot costs never reach `staff`). `POST /purchases` body: `{ idempotencyKey, supplierId, items: [{ productId, qty, purchasePrice, batchNumber?, expiryDate, weightKg? }], discount?, paymentMethod?, paidAmount, notes? }` — server creates/merges lots, computes all totals and snapshots, writes `PURCHASE` ledger rows, updates `Product.purchasePrice` to last lot cost, and accrues supplier payable in one transaction (Rule 20). Error contract: `400` amount/line guards + same-lot cost conflict + link mismatch, `404` unknown supplier/product, `409` duplicate idempotency conflict or already-voided (void), P2002 `(productId, batchNumber)` merge-race retry per Rule 21.
- `POST /api/v1/purchases/:id/void` (admin only): full-purchase void per Rule 22. No `PATCH`/`DELETE` on purchases (void only, mirrors sales).
- `POST /api/v1/payments` vendor side: `{ supplierId, amount, method, purchaseId? }` per Section 4.14; `GET /api/v1/payments?supplierId=` history.

---

## 8. Migration Notes for Implementers (not executed by this doc)

1. `UserRole`: remove `vendor` and `customer`, add `staff`, change default to `staff`. Existing `customer`/`vendor` rows must be remapped (decide: convert to staff or deactivate) before enum migration.
2. `Customer`: drop `userId` FK + `User.customer` back-relation; add `name`, `phone @unique`, `area`, `category`, `dueBalance`, `isActive`, `isDeleted`. Backfill walk-in/registered rows.
3. New `Supplier` model + `suppliers` table per Section 4.3.
4. Regenerate Prisma client, then update `USER_ROLES`, auth register default, and product cost-hiding for `staff`.
5. Purchase (E6): new `purchase.prisma` (`Purchase`, `PurchaseItem`, `PurchaseCounter`), `Supplier.purchases` back-relation, `ProductBatch.purchaseItems` back-relation, `Payment.supplierId/purchaseId` + relations (`Supplier.vendorPayments`, `Purchase.payments`). Migrate + generate. Backfill: none (tables start empty).

---

## 9. Open Questions / Gaps

- [ ] GAP-1 Costing method for Stock Value / Profit (no decision yet — blocks Profit and Stock Value reports only, NOT the Sale build). Sale already snapshots `SaleItem.purchasePrice` per lot, so any future method works without rework. Options: last `Product.purchasePrice` vs moving average vs FIFO per `ProductBatch.purchasePrice` / `SaleItem.purchasePrice` snapshot. Affected models: Section 4.5 `Product.purchasePrice`, Section 4.8 `ProductBatch.purchasePrice`, Section 4.11 `SaleItem.purchasePrice`.
- [ ] GAP-2 Due collection (`Payment` model) — required immediately after Sales, not before. POS can ship creating dues, but dues cannot be cleared until `Payment { saleId?, customerId, amount, method, collectedBy }` + `Customer.dueBalance -= amount` exists. Do not go live without it.
- [ ] GAP-3 Split payments, per-line discounts, automatic category discounts — explicitly out of v1 (Rule 17). Frontend must not assume them.
- [ ] GAP-4 Partial returns, sale edits — explicitly out of v1 (Rule 19 covers admin full-void only). Restock-to-new-batch is covered two ways: Purchase GRN (Rule 20) and admin full-void restock. Return-to-expired-lot handling deferred.
- [x] Near-expiry window and critical-stock thresholds — DECIDED 2026-09-18: near-expiry 20 days, critical at 40% of minStock. Applies to Section 4.5 + 4.8 derived status (see Rule 7).
- [ ] GAP-5 Audit depth (no storage yet — blocks a richer trail, NOT the Audit build). No table stores login history, approval workflow state, IP/device, export/download history, field-level before/after for master edits, or void/change reasons. Section 4.15 ships read-only over existing columns only; these dimensions must not be displayed until storage is specified.
- [x] Feed `weightKg` per lot — DECIDED 2026-09-18: optional, info-only, never blocks entry.
- [x] Walk-in sale without a customer record — DECIDED 2026-09-18: not allowed. Staff must create the customer first, then record the sale with required `customerId`.

---

## Document usage

```
PRD (client/prd.md) — what and why
  -> SRS (this file) — exact data model, relations, fields, rules
    -> Architecture (server/docs/architecture.md) — how it is built
      -> Code — implementation
```
