#!/usr/bin/env node
// One-time import of the legacy Zoho Creator "Landscape Material" catalog.
// Idempotent (skips names that already exist), so this can just be re-run
// with the full 128-row extract — originally only got 95 rows out before
// hitting a Zoho sign-in rate limit, finished later with the rest.
// Usage: node scripts/import-legacy-materials.js

const fs = require("fs");
const path = require("path");

// Load .env.local for DB credentials
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
    });
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DATA_PATH = path.join(__dirname, "legacy-materials-partial.json");

// Legacy's picklist labels -> our MaterialCategory enum values.
const CATEGORY_MAP = {
  "Bulk Material / Sod": "BULK_MATERIAL_SOD",
  "Seed / Fertilizer": "SEED_FERTILIZER",
  "Edging / Fabric / Pins / Etc": "EDGING_FABRIC_PINS",
  "Drainage Supplies": "DRAINAGE_SUPPLIES",
  "Sprinkler Supplies": "SPRINKLER_SUPPLIES",
  "Hardscape / Other Supplies": "HARDSCAPE_OTHER_SUPPLIES",
};

// Legacy wrote units as "per piece" / "per roll" / etc; normalize to the
// bare-noun style already used elsewhere in this app's job sheets
// ("Pieces", "Yards", "Feet").
const UNIT_MAP = {
  "per piece": "Pieces",
  "per roll": "Rolls",
  "per yard": "Yards",
  "per ton": "Tons",
  "per bottle": "Bottles",
  "per stick": "Sticks",
  "per kit": "Kits",
  "per bale": "Bales",
  "per lbs": "Lbs",
  "per 50 lbs": "50 lb Bags",
  "per 50lbs": "50 lb Bags",
};

function normalizeUnit(raw) {
  if (!raw) return "";
  return UNIT_MAP[raw.toLowerCase()] || raw;
}

function normalizeCategory(raw) {
  return CATEGORY_MAP[raw] || null;
}

// Fix a known typo in the legacy data so it doesn't fracture supplier grouping.
const SUPPLIER_FIXES = {
  "Centrail Irrigation": "Central Irrigation",
};

function normalizeSupplier(raw) {
  if (!raw) return null;
  return SUPPLIER_FIXES[raw] || raw;
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  console.log(`Loaded ${rows.length} legacy material rows`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.product.trim();
    if (!name) continue;

    const existing = await prisma.landscapeMaterial.findUnique({ where: { name } });
    if (existing) {
      skipped++;
      continue;
    }

    const price = row.price ? parseFloat(row.price) : null;

    await prisma.landscapeMaterial.create({
      data: {
        name,
        unit: normalizeUnit(row.unit),
        category: normalizeCategory(row.materialType),
        supplier: normalizeSupplier(row.supplier),
        defaultPrice: price != null && !isNaN(price) ? price : null,
        kind: "IN_HOUSE",
      },
    });
    created++;
  }

  console.log(`Created ${created} materials, skipped ${skipped} (already existed)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
