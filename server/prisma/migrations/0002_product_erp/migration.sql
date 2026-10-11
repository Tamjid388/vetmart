-- ERP Product migration (Option B-hybrid) — unified Product + extensions + fixed StockLedger↔ProductBatch relation
-- Plan: server/docs/product-schema-erp-plan.md §3–§4 (P1). Split schema: prisma/schema/*.prisma
-- FIX 2026-09-17: stock_ledger.batchId now has FK → product_batches(id) ON DELETE SET NULL + index; product_batches has back-relation ledgerEntries.

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MEDICINE', 'FEED');

-- CreateEnum
CREATE TYPE "MedicineForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'POWDER', 'DROPS', 'SUSPENSION', 'SOLUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductUnit" AS ENUM ('PIECE', 'STRIP', 'BOTTLE', 'BOX', 'VIAL', 'AMPOULE', 'TUBE', 'SACHET', 'BAG', 'KG', 'LITER', 'OTHER');

-- CreateEnum
CREATE TYPE "StockLedgerType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'OPENING');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_details" (
    "productId" TEXT NOT NULL,
    "form" "MedicineForm",
    "genericName" TEXT,
    "strength" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "medicine_details_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "feed_details" (
    "productId" TEXT NOT NULL,
    "targetSpecies" TEXT,
    "feedType" TEXT,
    "proteinPct" DECIMAL(5,2),
    "nominalPackKg" DECIMAL(8,2),

    CONSTRAINT "feed_details_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "product_batches" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "weightKg" DECIMAL(10,2),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ledger" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" "StockLedgerType" NOT NULL,
    "qtyDelta" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "refId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("id")
);

-- Seed Uncategorized categories (stable IDs so existing rows can be backfilled).
-- Seed script upserts by (productType, name), so these rows are reused, not duplicated.
INSERT INTO "categories" ("id", "productType", "name", "isActive", "createdAt", "updatedAt")
VALUES
  ('migration-medicine-uncat', 'MEDICINE', 'Uncategorized', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('migration-feed-uncat', 'FEED', 'Uncategorized', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add new product columns as NULLABLE first (table has existing rows).
ALTER TABLE "products" ADD COLUMN "barcode" TEXT,
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "isActive" BOOLEAN DEFAULT true,
ADD COLUMN "manufacturer" TEXT,
ADD COLUMN "minStock" INTEGER DEFAULT 0,
ADD COLUMN "productType" "ProductType",
ADD COLUMN "purchasePrice" DECIMAL(10,2),
ADD COLUMN "sellingPrice" DECIMAL(10,2),
ADD COLUMN "sku" TEXT,
ADD COLUMN "unit" "ProductUnit",
ADD COLUMN "vatPercent" DECIMAL(5,2) DEFAULT 0;

-- Backfill new columns from legacy price/stock. Existing rows become MEDICINE + PIECE per plan P1 step 2.
UPDATE "products"
SET "productType" = 'MEDICINE',
    "categoryId" = 'migration-medicine-uncat',
    "unit" = 'PIECE',
    "purchasePrice" = "price",
    "sellingPrice" = "price",
    "minStock" = 0,
    "vatPercent" = 0,
    "isActive" = true
WHERE "productType" IS NULL;

-- Migrate existing rows: 1 MedicineDetails row per product (plan P1 step 3).
INSERT INTO "medicine_details" ("productId")
SELECT "id" FROM "products"
ON CONFLICT ("productId") DO NOTHING;

-- Migrate existing rows: 1 OPENING batch per product, stock carried over (plan P1 step 3).
INSERT INTO "product_batches" ("id", "productId", "batchNumber", "expiryDate", "purchasePrice", "stock", "receivedAt")
SELECT gen_random_uuid()::text, "id", 'OPENING', NULL, "price", "stock", CURRENT_TIMESTAMP
FROM "products";

-- Backfill ledger with OPENING entries (plan P1 step 4).
-- Service invariant: ledger.productId MUST equal batch.productId (enforced here by selecting from the batch row).
INSERT INTO "stock_ledger" ("id", "productId", "batchId", "type", "qtyDelta", "stockAfter", "createdAt")
SELECT gen_random_uuid()::text, b."productId", b."id", 'OPENING', b."stock", b."stock", CURRENT_TIMESTAMP
FROM "product_batches" b;

-- Drop legacy columns now that data is preserved in sellingPrice/purchasePrice + batches.
ALTER TABLE "products" DROP COLUMN "price", DROP COLUMN "stock";

-- Enforce NOT NULL + defaults after backfill.
ALTER TABLE "products" ALTER COLUMN "categoryId" SET NOT NULL,
ALTER COLUMN "productType" SET NOT NULL,
ALTER COLUMN "purchasePrice" SET NOT NULL,
ALTER COLUMN "sellingPrice" SET NOT NULL,
ALTER COLUMN "unit" SET NOT NULL,
ALTER COLUMN "minStock" SET NOT NULL,
ALTER COLUMN "minStock" SET DEFAULT 0,
ALTER COLUMN "vatPercent" SET NOT NULL,
ALTER COLUMN "vatPercent" SET DEFAULT 0,
ALTER COLUMN "isActive" SET NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT true;

-- CreateIndex
CREATE INDEX "categories_productType_idx" ON "categories"("productType");

-- CreateIndex
CREATE UNIQUE INDEX "categories_productType_name_key" ON "categories"("productType", "name");

-- CreateIndex
CREATE INDEX "product_batches_productId_idx" ON "product_batches"("productId");

-- CreateIndex
CREATE INDEX "product_batches_expiryDate_idx" ON "product_batches"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_productId_batchNumber_key" ON "product_batches"("productId", "batchNumber");

-- CreateIndex
CREATE INDEX "stock_ledger_productId_createdAt_idx" ON "stock_ledger"("productId", "createdAt");

-- CreateIndex (FIX 2026-09-17: was missing — StockLedger.batch relation needs it)
CREATE INDEX "stock_ledger_batchId_idx" ON "stock_ledger"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_productType_idx" ON "products"("productType");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_details" ADD CONSTRAINT "medicine_details_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_details" ADD CONSTRAINT "feed_details_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (FIX 2026-09-17: was missing — preserves audit trail when a lot is deleted)
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "product_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
