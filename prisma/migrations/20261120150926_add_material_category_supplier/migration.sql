-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('BULK_MATERIAL_SOD', 'SEED_FERTILIZER', 'EDGING_FABRIC_PINS', 'DRAINAGE_SUPPLIES', 'SPRINKLER_SUPPLIES', 'HARDSCAPE_OTHER_SUPPLIES');

-- AlterTable
ALTER TABLE "landscape_materials" ADD COLUMN     "category" "MaterialCategory",
ADD COLUMN     "supplier" TEXT;
