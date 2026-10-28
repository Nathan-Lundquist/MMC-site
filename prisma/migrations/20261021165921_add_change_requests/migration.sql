-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "change_requests" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'OPEN',
    "notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
