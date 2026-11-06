-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('IN_HOUSE', 'OUTSOURCED');

-- AlterEnum
ALTER TYPE "JobCategory" ADD VALUE 'WARRANTY';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "hourly_rate" DECIMAL(8,2);

-- AlterTable
ALTER TABLE "landscape_materials" ADD COLUMN     "default_price" DECIMAL(10,2),
ADD COLUMN     "kind" "MaterialKind" NOT NULL DEFAULT 'IN_HOUSE';

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "unit_price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "estimate_number" TEXT;
