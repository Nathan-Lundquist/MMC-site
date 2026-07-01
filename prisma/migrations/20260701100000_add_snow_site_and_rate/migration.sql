-- CreateTable
CREATE TABLE "snow_sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snow_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snow_rates" (
    "id" TEXT NOT NULL,
    "bulk_salt_per_yard" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ice_melter_per_bag" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "calcium_per_bag" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "employee_per_hour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fuel_per_hour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "indirect_multiplier" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snow_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snow_sites_name_key" ON "snow_sites"("name");
