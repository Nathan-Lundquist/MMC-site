-- AlterTable
ALTER TABLE "employees" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employees_username_key" ON "employees"("username");
