-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('REGISTERED', 'CASH');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN "saleType" "SaleType" NOT NULL DEFAULT 'REGISTERED';
ALTER TABLE "sales" ALTER COLUMN "customerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "sales_saleType_idx" ON "sales"("saleType");
