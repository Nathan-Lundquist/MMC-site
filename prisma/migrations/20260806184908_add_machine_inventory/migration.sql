-- AlterTable
ALTER TABLE "machines" ADD COLUMN     "machine_inventory_id" TEXT;

-- CreateTable
CREATE TABLE "machine_inventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serial_number" TEXT,
    "service_interval_hours" DECIMAL(8,2),
    "service_interval_days" INTEGER,
    "last_service_date" TIMESTAMP(3),
    "last_service_hours" DECIMAL(8,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_service_logs" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "hours_at_service" DECIMAL(8,2),
    "service_type" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_service_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_machine_inventory_id_fkey" FOREIGN KEY ("machine_inventory_id") REFERENCES "machine_inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_service_logs" ADD CONSTRAINT "machine_service_logs_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machine_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
