#!/usr/bin/env node
// Import snow storms + site services from Zoho CSV exports
// Usage: node scripts/import-snow.js

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

const STORM_CSV = path.join(__dirname, "../uploads/1781114156358_Snow Storm Reports.csv");
const SERVICE_CSV = path.join(__dirname, "../uploads/1781114159808_Admin Site Service.csv");

// Parse "17-Mar-2026 05:00" → Date (UTC)
const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
function parseDate(str) {
  if (!str || !str.trim()) return null;
  const m = str.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) { console.warn("  bad date:", str); return null; }
  return new Date(Date.UTC(+m[3], MONTHS[m[2]], +m[1], +m[4], +m[5]));
}

function num(s) { return parseFloat(s) || 0; }
function int(s) { return parseInt(s) || 0; }
function bool(s) { return s && s.trim().toLowerCase() === "true"; }

// Minimal CSV parser (handles RFC 4180: quoted fields, "" escaping)
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"' && content[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field.trim()); field = ""; }
      else if (c === '\n') {
        row.push(field.trim()); field = "";
        if (row.some(f => f)) rows.push(row);
        row = [];
      } else if (c !== '\r') { field += c; }
    }
  }
  if (field || row.length > 0) { row.push(field.trim()); if (row.some(f => f)) rows.push(row); }
  return rows;
}

async function main() {
  console.log("Importing snow data...\n");

  // ── 1. Parse Storms ──────────────────────────────────────────
  const stormRows = parseCSV(STORM_CSV);
  const stormHeader = stormRows[0];
  console.log(`Storm CSV: ${stormRows.length - 1} data rows`);
  console.log("Columns:", stormHeader.join(" | "));

  const storms = [];
  for (let i = 1; i < stormRows.length; i++) {
    const r = stormRows[i];
    const eventStart = parseDate(r[1]);
    const eventEnd = parseDate(r[2]);
    if (!eventStart || !eventEnd) { console.warn(`  Skipping storm row ${i}: bad dates`); continue; }
    storms.push({
      description: r[0] || `Storm ${i}`,
      eventStart,
      eventEnd,
      masterTimeOnSite: num(r[3]),
      fuelCost: num(r[4]),
      laborCost: num(r[5]),
      subCost: num(r[6]),
      indirectCost: num(r[7]),
      directCost: num(r[8]),
      totalCost: num(r[9]),
    });
  }
  console.log(`\nParsed ${storms.length} storms`);

  // ── 2. Parse Site Services ───────────────────────────────────
  const svcRows = parseCSV(SERVICE_CSV);
  const svcHeader = svcRows[0];
  console.log(`\nService CSV: ${svcRows.length - 1} data rows`);

  const services = [];
  let skipped = 0;
  for (let i = 1; i < svcRows.length; i++) {
    const r = svcRows[i];
    const startTime = parseDate(r[1]);
    const endTime = parseDate(r[2]);
    if (!startTime || !endTime) { skipped++; continue; }
    services.push({
      siteName: r[0] || "Unknown Site",
      startTime,
      endTime,
      servicesPerformed: r[3] || "",
      bulkSaltYards: num(r[4]),
      iceMelterBags: num(r[5]),
      calciumChlorideBags: num(r[6]),
      workerName: r[7] || null,
      addedUser: r[8] || null,
      plowCount: int(r[9]),
      saltLotCount: int(r[10]),
      shovelCount: int(r[11]),
      saltWalkCount: int(r[12]),
      additionalWorkRequested: bool(r[13]),
      additionalWorkDesc: r[14] || null,
      totalDirect: num(r[15]),
      totalIndirect: num(r[16]),
      employeeCost: num(r[17]),
      subCost: num(r[18]),
      siteNotes: r[19] || null,
      bulkSaltCost: num(r[20]),
      calciumCost: num(r[21]),
      fuelCost: num(r[22]),
      iceMelterCost: num(r[23]),
    });
  }
  console.log(`Parsed ${services.length} services (skipped ${skipped} with bad dates)`);

  // ── 3. Insert Storms ─────────────────────────────────────────
  console.log("\nInserting storms...");
  const insertedStorms = [];
  for (const s of storms) {
    const created = await prisma.snowStorm.create({ data: s });
    insertedStorms.push(created);
    process.stdout.write(".");
  }
  console.log(`\nInserted ${insertedStorms.length} storms`);

  // ── 4. Link + Insert Site Services ──────────────────────────
  console.log("\nLinking and inserting site services...");
  let linked = 0, unlinked = 0;

  // Build lookup: for each service, find storm whose window contains startTime
  const CHUNK = 200;
  for (let i = 0; i < services.length; i += CHUNK) {
    const chunk = services.slice(i, i + CHUNK);
    await prisma.$transaction(
      chunk.map((svc) => {
        const storm = insertedStorms.find(
          (st) => svc.startTime >= st.eventStart && svc.startTime <= st.eventEnd
        );
        if (storm) linked++; else unlinked++;
        return prisma.snowSiteService.create({
          data: { ...svc, stormId: storm?.id ?? null },
        });
      })
    );
    process.stdout.write(".");
  }
  console.log(`\nLinked: ${linked}, Unlinked: ${unlinked}`);

  // ── 5. Summary ───────────────────────────────────────────────
  const stormCount = await prisma.snowStorm.count();
  const svcCount = await prisma.snowSiteService.count();
  const totals = await prisma.snowStorm.aggregate({
    _sum: { totalCost: true, laborCost: true, subCost: true, fuelCost: true },
  });
  console.log(`\n✓ Done — ${stormCount} storms, ${svcCount} services in DB`);
  console.log(`  Total revenue: $${Number(totals._sum.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  console.log(`  Labor: $${Number(totals._sum.laborCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  console.log(`  Sub: $${Number(totals._sum.subCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  console.log(`  Fuel: $${Number(totals._sum.fuelCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
