-- E2-parties: decouple Customer from User; add Supplier master (SRS 4.2, 4.3).
-- Backfill convention for pre-existing customer rows (table was empty at migration
-- time, so the UPDATEs below are no-ops in practice):
--   name  = 'Walk-in <id>'  (e.g. 'Walk-in cm123abc')
--   phone = 'WALKIN-<id>'   (unique per row because id is unique; staff must replace
--                            with the real phone number before E4 POS use)

-- 1. Decouple customers from users
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_userId_fkey";
DROP INDEX IF EXISTS "customers_userId_key";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "userId";

-- 2. Add new columns as nullable first so the backfill works on non-empty tables
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "area" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "dueBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- 3. Backfill placeholders for legacy rows missing name/phone
UPDATE "customers" SET "name" = 'Walk-in ' || "id" WHERE "name" IS NULL;
UPDATE "customers" SET "phone" = 'WALKIN-' || "id" WHERE "phone" IS NULL;

-- 4. Enforce required name + unique phone
ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "phone" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");

-- 5. New suppliers table per SRS 4.3 (standalone, no FK to User)
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "tradeLicense" TEXT,
    "paymentTerms" INTEGER,
    "payableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "suppliers_phone_key" ON "suppliers"("phone");
