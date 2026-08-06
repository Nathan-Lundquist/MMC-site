-- CreateEnum
CREATE TYPE "ExtraType" AS ENUM ('DELIVERY', 'SETUP', 'UNLOAD', 'OTHER');

-- CreateTable
CREATE TABLE "snow_storms" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_start" TIMESTAMP(3) NOT NULL,
    "event_end" TIMESTAMP(3) NOT NULL,
    "master_time_on_site" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "fuel_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "labor_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sub_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "indirect_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "direct_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snow_storms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snow_site_services" (
    "id" TEXT NOT NULL,
    "storm_id" TEXT,
    "site_name" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "services_performed" TEXT NOT NULL,
    "bulk_salt_yards" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "ice_melter_bags" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "calcium_chloride_bags" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "worker_name" TEXT,
    "added_user" TEXT,
    "plow_count" INTEGER NOT NULL DEFAULT 0,
    "salt_lot_count" INTEGER NOT NULL DEFAULT 0,
    "shovel_count" INTEGER NOT NULL DEFAULT 0,
    "salt_walk_count" INTEGER NOT NULL DEFAULT 0,
    "addl_work_requested" BOOLEAN NOT NULL DEFAULT false,
    "addl_work_desc" TEXT,
    "total_direct" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_indirect" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "employee_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sub_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "site_notes" TEXT,
    "bulk_salt_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "calcium_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuel_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ice_melter_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snow_site_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "punch_records" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "wo_id" TEXT,
    "punch_in" TIMESTAMP(3) NOT NULL,
    "punch_out" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "punch_extras" (
    "id" TEXT NOT NULL,
    "punch_record_id" TEXT NOT NULL,
    "type" "ExtraType" NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_extras_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "snow_site_services" ADD CONSTRAINT "snow_site_services_storm_id_fkey" FOREIGN KEY ("storm_id") REFERENCES "snow_storms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_records" ADD CONSTRAINT "punch_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_records" ADD CONSTRAINT "punch_records_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_extras" ADD CONSTRAINT "punch_extras_punch_record_id_fkey" FOREIGN KEY ("punch_record_id") REFERENCES "punch_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
