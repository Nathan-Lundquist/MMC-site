-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'FOREMAN', 'CREW');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "TimeUnit" AS ENUM ('HOURS', 'MINUTES');

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CREW',
    "password_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'MI',
    "zip" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "wo_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "foreman_id" TEXT,
    "job_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "pct_complete" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "materials_not_used" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "check_number" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL,
    "image_path" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "vehicle_info" TEXT NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_details" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "employee_id" TEXT,
    "job_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "setup_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "travel_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "unload_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "delivery_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,

    CONSTRAINT "crew_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debris" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount_yards" DECIMAL(6,2) NOT NULL,
    "type" TEXT,

    CONSTRAINT "debris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weeding" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "num_employees" INTEGER NOT NULL,
    "time_value" DECIMAL(6,2) NOT NULL,
    "time_unit" "TimeUnit" NOT NULL DEFAULT 'HOURS',

    CONSTRAINT "weeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_work" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type_of_work" TEXT NOT NULL,
    "num_employees" INTEGER NOT NULL,
    "time_value" DECIMAL(6,2) NOT NULL,
    "time_unit" "TimeUnit" NOT NULL DEFAULT 'HOURS',

    CONSTRAINT "hourly_work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "units" TEXT,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outsourced_materials" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,
    "cost" DECIMAL(10,2),
    "per_unit_cost" DECIMAL(10,2),
    "tax_included" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "outsourced_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_work" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "number" INTEGER,
    "date" TIMESTAMP(3),
    "status" TEXT,
    "type_of_work" TEXT,
    "description" TEXT,

    CONSTRAINT "additional_work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_work_crew" (
    "id" TEXT NOT NULL,
    "addl_work_id" TEXT NOT NULL,
    "number" INTEGER,
    "date" TIMESTAMP(3),
    "employee_id" TEXT,
    "job_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "delivery_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,

    CONSTRAINT "additional_work_crew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_work_materials" (
    "id" TEXT NOT NULL,
    "addl_work_id" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "units" TEXT,
    "is_outsourced" BOOLEAN NOT NULL DEFAULT false,
    "supplier" TEXT,
    "cost" DECIMAL(10,2),
    "per_unit_cost" DECIMAL(10,2),

    CONSTRAINT "additional_work_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_wo_number_key" ON "work_orders"("wo_number");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_foreman_id_fkey" FOREIGN KEY ("foreman_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_details" ADD CONSTRAINT "crew_details_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_details" ADD CONSTRAINT "crew_details_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debris" ADD CONSTRAINT "debris_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weeding" ADD CONSTRAINT "weeding_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hourly_work" ADD CONSTRAINT "hourly_work_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outsourced_materials" ADD CONSTRAINT "outsourced_materials_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_work" ADD CONSTRAINT "additional_work_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_work_crew" ADD CONSTRAINT "additional_work_crew_addl_work_id_fkey" FOREIGN KEY ("addl_work_id") REFERENCES "additional_work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_work_crew" ADD CONSTRAINT "additional_work_crew_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_work_materials" ADD CONSTRAINT "additional_work_materials_addl_work_id_fkey" FOREIGN KEY ("addl_work_id") REFERENCES "additional_work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
