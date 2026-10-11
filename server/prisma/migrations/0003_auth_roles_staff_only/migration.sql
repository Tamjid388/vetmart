-- E1-auth: narrow UserRole to staff-only auth (admin + staff).
-- Data remap choice: REMAP legacy rows to 'staff' (no deactivation).
-- The remap happens inside the type conversion because Postgres cannot
-- store 'staff' while the old enum is still in place, and ADD VALUE cannot
-- run inside Prisma's migration transaction.
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('admin', 'staff');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE WHEN "role"::text IN ('customer', 'vendor') THEN 'staff'::"UserRole"
       ELSE "role"::text::"UserRole"
  END
);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'staff';
DROP TYPE "UserRole_old";
