-- CreateEnum
CREATE TYPE "ReceiptType" AS ENUM ('MATERIALS', 'FUEL', 'DUMP_FEE', 'OTHER');

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ReceiptType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
