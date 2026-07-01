-- CreateTable
CREATE TABLE "landscape_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landscape_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_work_logs" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "work_type" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "crew_members" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crew_work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crew_work_log_materials" (
    "id" TEXT NOT NULL,
    "log_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "crew_work_log_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landscape_materials_name_key" ON "landscape_materials"("name");

-- AddForeignKey
ALTER TABLE "crew_work_logs" ADD CONSTRAINT "crew_work_logs_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_work_log_materials" ADD CONSTRAINT "crew_work_log_materials_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "crew_work_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crew_work_log_materials" ADD CONSTRAINT "crew_work_log_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "landscape_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
