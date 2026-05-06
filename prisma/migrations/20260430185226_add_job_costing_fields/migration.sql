-- CreateEnum
CREATE TYPE "JobCategory" AS ENUM ('LANDSCAPE', 'FALL_CLEANUP', 'SPRING_CLEANUP', 'SUBCONTRACTOR', 'IN_HOUSE_REPAIR', 'BED_MAINTENANCE', 'SPRINKLER', 'LIGHTING', 'HARDSCAPE', 'OTHER');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'ZOHO', 'EXCEL_IMPORT');

-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "actual_hours" DECIMAL(8,2),
ADD COLUMN     "actual_job_time" DECIMAL(8,2),
ADD COLUMN     "actual_setup_unload" DECIMAL(8,2),
ADD COLUMN     "actual_total_man_hours" DECIMAL(8,2),
ADD COLUMN     "actual_travel_hours" DECIMAL(8,2),
ADD COLUMN     "amount_owed" DECIMAL(10,2),
ADD COLUMN     "amount_paid" DECIMAL(10,2),
ADD COLUMN     "crew_total" DECIMAL(10,2),
ADD COLUMN     "crew_wage" DECIMAL(10,2),
ADD COLUMN     "data_source" "DataSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "date_paid" TIMESTAMP(3),
ADD COLUMN     "dump_cost" DECIMAL(10,2),
ADD COLUMN     "est_crew_size" INTEGER,
ADD COLUMN     "est_crew_total" DECIMAL(10,2),
ADD COLUMN     "est_crew_wage" DECIMAL(10,2),
ADD COLUMN     "est_hours" DECIMAL(8,2),
ADD COLUMN     "est_total_man_hours" DECIMAL(8,2),
ADD COLUMN     "fuel_cost" DECIMAL(10,2),
ADD COLUMN     "invoice_amount" DECIMAL(10,2),
ADD COLUMN     "invoice_number" TEXT,
ADD COLUMN     "job_category" "JobCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "material_cost" DECIMAL(10,2),
ADD COLUMN     "profit" DECIMAL(10,2),
ADD COLUMN     "profit_pct" DECIMAL(8,4),
ADD COLUMN     "source_file" TEXT,
ADD COLUMN     "source_year" INTEGER,
ADD COLUMN     "sub_cost" DECIMAL(10,2),
ADD COLUMN     "total_direct_expense" DECIMAL(10,2),
ADD COLUMN     "total_indirect_expense" DECIMAL(10,2);
