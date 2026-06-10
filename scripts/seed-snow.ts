import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  // Handle multi-line quoted fields
  let currentLine = "";
  for (let i = 1; i < lines.length; i++) {
    currentLine += (currentLine ? "\n" : "") + lines[i];
    const quoteCount = (currentLine.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      const values = parseCSVLine(currentLine);
      if (values.some((v) => v.trim())) {
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h.trim()] = (values[idx] || "").trim();
        });
        rows.push(row);
      }
      currentLine = "";
    }
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDate(dateStr: string): Date {
  // Format: "17-Mar-2026 05:00" or "31-Dec-2026 19:10"
  const cleaned = dateStr.replace(/"/g, "").trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) return parsed;

  // Manual parse: DD-Mon-YYYY HH:MM
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const match = cleaned.match(/(\d{1,2})-(\w{3})-(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (match) {
    const [, day, mon, year, hour, min] = match;
    return new Date(parseInt(year), months[mon], parseInt(day), parseInt(hour), parseInt(min));
  }
  throw new Error(`Cannot parse date: ${dateStr}`);
}

function toDecimal(val: string): number {
  const num = parseFloat(val.replace(/[",]/g, ""));
  return isNaN(num) ? 0 : num;
}

function toInt(val: string): number {
  const num = parseInt(val.replace(/[",]/g, ""), 10);
  return isNaN(num) ? 0 : num;
}

async function main() {
  const uploadsDir = path.join(process.cwd(), "uploads");

  // Find the files
  const stormFile = fs.readdirSync(uploadsDir).find((f) => f.includes("Snow Storm Reports"));
  const siteFile = fs.readdirSync(uploadsDir).find((f) => f.includes("Admin Site Service"));

  if (!stormFile || !siteFile) {
    console.error("Missing CSV files in uploads/");
    process.exit(1);
  }

  // Clear existing snow data
  await prisma.snowSiteService.deleteMany();
  await prisma.snowStorm.deleteMany();
  console.log("Cleared existing snow data");

  // 1. Import Snow Storm Reports
  const storms = parseCSV(path.join(uploadsDir, stormFile));
  console.log(`Parsing ${storms.length} storm records...`);

  const stormRecords = [];
  for (const row of storms) {
    const description = row["Snow Fall"] || row["Snow Fall "] || "";
    if (!description) continue;

    const startStr = row["Event Start Time"];
    const endStr = row["Event End Time"];
    if (!startStr || !endStr) continue;

    const record = await prisma.snowStorm.create({
      data: {
        description,
        eventStart: parseDate(startStr),
        eventEnd: parseDate(endStr),
        masterTimeOnSite: toDecimal(row["Master Time on Sites"]),
        fuelCost: toDecimal(row["Fuel Costs"]),
        laborCost: toDecimal(row["Labor Costs"]),
        subCost: toDecimal(row["Sub Costs"]),
        indirectCost: toDecimal(row["Indirect Cost"]),
        directCost: toDecimal(row["Direct Cost"]),
        totalCost: toDecimal(row["Total Cost"]),
      },
    });
    stormRecords.push(record);
  }
  console.log(`Imported ${stormRecords.length} snow storms`);

  // 2. Import Site Services and link to storms by matching event start times
  const sites = parseCSV(path.join(uploadsDir, siteFile));
  console.log(`Parsing ${sites.length} site service records...`);

  let imported = 0;
  let linked = 0;

  for (const row of sites) {
    const siteName = row["Snow Sites"] || "";
    const startStr = row["Start Time"] || "";
    const endStr = row["End Time"] || "";
    if (!siteName || !startStr || !endStr) continue;

    const startTime = parseDate(startStr);
    const endTime = parseDate(endStr);

    // Try to match to a storm: site service time should fall within storm event window
    let matchedStormId: string | null = null;
    for (const storm of stormRecords) {
      if (startTime >= storm.eventStart && startTime <= storm.eventEnd) {
        matchedStormId = storm.id;
        linked++;
        break;
      }
    }

    await prisma.snowSiteService.create({
      data: {
        stormId: matchedStormId,
        siteName,
        startTime,
        endTime,
        servicesPerformed: row["Services Performed"] || "",
        bulkSaltYards: toDecimal(row["Amount of Bulk Salt ( Yards / Per Quater )"]),
        iceMelterBags: toDecimal(row["Amount of Ice Melter ( Bags / Per Quater )"]),
        calciumChlorideBags: toDecimal(row["Amount of Calcium Chloride ( Bags / Per Quater )"]),
        workerName: row["Winter Employees/Subs"] || null,
        addedUser: row["Added User"] || null,
        plowCount: toInt(row["Number of Plows for a lot"]),
        saltLotCount: toInt(row["Number of Salts for a lot"]),
        shovelCount: toInt(row["Number of Shovels for walks"]),
        saltWalkCount: toInt(row["Number of Salt for walks"]),
        additionalWorkRequested: row["Client Requests Additional Work"] === "true",
        additionalWorkDesc: row["Additional Work"] || null,
        totalDirect: toDecimal(row["Total Direct"]),
        totalIndirect: toDecimal(row["Total Indirect"]),
        employeeCost: toDecimal(row["Employee"]),
        subCost: toDecimal(row["Sub"]),
        siteNotes: row["Site Notes"] || null,
        bulkSaltCost: toDecimal(row["Bulk Salt"]),
        calciumCost: toDecimal(row["Calcium Chloride"]),
        fuelCost: toDecimal(row["Fuel"]),
        iceMelterCost: toDecimal(row["Ice Melter"]),
      },
    });
    imported++;

    if (imported % 500 === 0) console.log(`  ...${imported} site services imported`);
  }

  console.log(`\nDone!`);
  console.log(`  ${stormRecords.length} snow storms`);
  console.log(`  ${imported} site services (${linked} linked to storms)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
