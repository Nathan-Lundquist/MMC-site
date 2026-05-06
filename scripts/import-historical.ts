/**
 * Import historical MCC job costing data from Excel files (2016-2022)
 *
 * File types handled:
 * 1. Yearly Job Costing (Landscape, Fall Cleanup, Spring Cleanup, In House Repair)
 * 2. Subcontractors Job Costing
 * 3. Weekly Analysis sheets
 * 4. 2022 Landscaping Jobs (Zoho export with 206 full records)
 * 5. 2023 MCC App Landscape Job Costing Figures
 *
 * Usage: npx tsx scripts/import-historical.ts
 */

import { PrismaClient, JobCategory, DataSource, WorkOrderStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const EXTRACT_DIR = path.join(process.cwd(), "uploads/1777573585966_extracted");

// Track stats
const stats = {
  filesProcessed: 0,
  jobCostingImported: 0,
  weeklyAnalysisImported: 0,
  subcontractorImported: 0,
  customersCreated: 0,
  skipped: 0,
  errors: 0,
};

// Generate unique WO numbers for historical data
let woCounter = 0;
function generateHistoricalWO(year: number, category: string): string {
  woCounter++;
  const prefix = year.toString().slice(-2);
  const catCode = category.slice(0, 2).toUpperCase();
  return `${prefix}-H${catCode}${String(woCounter).padStart(4, "0")}`;
}

// Convert Excel serial date to JS Date
function excelDateToDate(serial: number | string | null | undefined): Date | null {
  if (serial === null || serial === undefined || serial === "") return null;
  const num = typeof serial === "string" ? parseFloat(serial) : serial;
  if (isNaN(num) || num < 1) return null;
  // Excel epoch: Jan 1 1900 (with the leap year bug)
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + num * 86400000);
  return isNaN(date.getTime()) ? null : date;
}

// Parse decimal safely
function parseDecimal(val: unknown): number | null {
  if (val === null || val === undefined || val === "" || val === "-") return null;
  const num = typeof val === "string" ? parseFloat(val.replace(/[$,]/g, "")) : Number(val);
  return isNaN(num) ? null : num;
}

// Find or create customer by name
const customerCache = new Map<string, string>();
async function findOrCreateCustomer(name: string): Promise<string> {
  if (!name || typeof name !== "string") throw new Error("No customer name");
  const trimmed = name.trim();
  if (customerCache.has(trimmed)) return customerCache.get(trimmed)!;

  let customer = await prisma.customer.findFirst({ where: { name: trimmed } });
  if (!customer) {
    customer = await prisma.customer.create({ data: { name: trimmed, state: "MI" } });
    stats.customersCreated++;
  }
  customerCache.set(trimmed, customer.id);
  return customer.id;
}

// Detect year from filename
function detectYear(filename: string): number {
  const match = filename.match(/\b(20\d{2})\b/);
  if (match) return parseInt(match[1]);
  // Try date-based filenames like "June 6th, 2021"
  const dateMatch = filename.match(/,\s*(20\d{2})/);
  if (dateMatch) return parseInt(dateMatch[1]);
  return 2020; // fallback
}

// Detect job category from filename
function detectCategory(filename: string): JobCategory {
  const lower = filename.toLowerCase();
  if (lower.includes("fall clean")) return "FALL_CLEANUP";
  if (lower.includes("spring clean")) return "SPRING_CLEANUP";
  if (lower.includes("subcontractor")) return "SUBCONTRACTOR";
  if (lower.includes("in house repair")) return "IN_HOUSE_REPAIR";
  if (lower.includes("landscape") || lower.includes("landscaping")) return "LANDSCAPE";
  return "OTHER";
}

// ── Import Yearly Job Costing Files ──────────────────────────

async function importJobCostingFile(filePath: string, filename: string) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  const year = detectYear(filename);
  const category = detectCategory(filename);

  // Find header row (contains "Customer Name" or "Customer")
  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] as unknown[];
    if (!row) continue;
    const rowStr = row.map(String).join("|").toLowerCase();
    if (rowStr.includes("customer name") || rowStr.includes("customer")) {
      headerIdx = i;
      headers = row.map((c) => String(c ?? "").trim());
      break;
    }
  }

  if (headerIdx === -1) {
    console.log(`  ⚠ No header row found in ${filename}, skipping`);
    stats.skipped++;
    return;
  }

  // Map column indices
  const col = (name: string) => {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));
    return idx;
  };

  const dateCol = col("Date");
  const customerCol = headers.findIndex((h) => /customer/i.test(h));
  const jobTypeCol = col("Type of Job");
  const invoiceNumCol = headers.findIndex((h) => /invoice\s*#|invoice\s*number/i.test(h));
  const estWageCol = col("Est. Crew Wage") !== -1 ? col("Est. Crew Wage") : col("EST Crew");
  const estHrsCol = col("Est. Hrs");
  const estCrewTotalCol = col("Est. Crew Total") !== -1 ? col("Est. Crew Total") : col("EST Crew Total");

  // Invoice amount column varies by file type
  const invoiceAmtCol = headers.findIndex((h) =>
    /invoice amount|ls amount|sc amount|fc amount/i.test(h)
  );

  const crewWageCol = headers.findIndex(
    (h, i) => /^crew wage$/i.test(h.trim()) && i > (estWageCol >= 0 ? estWageCol : -1)
  );
  const hoursCol = headers.findIndex(
    (h, i) => /^hours$/i.test(h.trim()) && i > (estHrsCol >= 0 ? estHrsCol : -1)
  );
  const crewTotalCol = headers.findIndex(
    (h, i) => /^crew total$/i.test(h.trim()) && i > (estCrewTotalCol >= 0 ? estCrewTotalCol : -1)
  );
  const materialCostCol = col("Material Cost");
  const subCostCol = headers.findIndex((h) => /^sub cost$/i.test(h.trim()));
  const dumpCol = col("Dump");
  const fuelCol = col("Fuel");
  const totalDirectCol = col("Total Direct");
  const totalIndirectCol = col("Total Indirect");
  const profitCol = headers.findIndex((h) => /^profit$/i.test(h.trim()));
  const profitPctCol = headers.findIndex((h) => /profit\s*%|%\s*profit/i.test(h));
  const paidCol = headers.findIndex((h) => /^paid$/i.test(h.trim()));
  const datePaidCol = col("Date Paid");

  // Process data rows
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length < 3) continue;

    const customerName = row[customerCol];
    if (!customerName || typeof customerName !== "string" && typeof customerName !== "number") continue;
    const custStr = String(customerName).trim();
    if (!custStr || custStr.toLowerCase().includes("total") || custStr.toLowerCase().includes("amount owed")) continue;

    try {
      const customerId = await findOrCreateCustomer(custStr);
      const date = dateCol >= 0 ? excelDateToDate(row[dateCol] as number) : null;
      const invoiceNum = invoiceNumCol >= 0 ? String(row[invoiceNumCol] ?? "").trim() : null;
      const jobType = jobTypeCol >= 0 && row[jobTypeCol] ? String(row[jobTypeCol]).trim() : category.replace(/_/g, " ");

      const invoiceAmount = invoiceAmtCol >= 0 ? parseDecimal(row[invoiceAmtCol]) : null;
      const paid = paidCol >= 0 ? parseDecimal(row[paidCol]) : null;
      const paidDate = datePaidCol >= 0 ? excelDateToDate(row[datePaidCol] as number) : null;

      // Determine status
      let status: WorkOrderStatus = "COMPLETED";
      if (paid !== null && invoiceAmount !== null && paid >= invoiceAmount) {
        status = "PAID";
      } else if (paid !== null && paid > 0) {
        status = "INVOICED";
      }

      const woNumber = invoiceNum && invoiceNum.startsWith("#")
        ? invoiceNum.replace("#", "")
        : generateHistoricalWO(year, category);

      // Check for duplicate WO number
      const existing = await prisma.workOrder.findUnique({ where: { workOrderNumber: woNumber } });
      if (existing) {
        // Update existing record with financial data
        await prisma.workOrder.update({
          where: { id: existing.id },
          data: {
            invoiceNumber: invoiceNum,
            invoiceAmount: invoiceAmount,
            estCrewWage: estWageCol >= 0 ? parseDecimal(row[estWageCol]) : undefined,
            estHours: estHrsCol >= 0 ? parseDecimal(row[estHrsCol]) : undefined,
            estCrewTotal: estCrewTotalCol >= 0 ? parseDecimal(row[estCrewTotalCol]) : undefined,
            crewWage: crewWageCol >= 0 ? parseDecimal(row[crewWageCol]) : undefined,
            actualHours: hoursCol >= 0 ? parseDecimal(row[hoursCol]) : undefined,
            crewTotal: crewTotalCol >= 0 ? parseDecimal(row[crewTotalCol]) : undefined,
            materialCost: materialCostCol >= 0 ? parseDecimal(row[materialCostCol]) : undefined,
            subCost: subCostCol >= 0 ? parseDecimal(row[subCostCol]) : undefined,
            dumpCost: dumpCol >= 0 ? parseDecimal(row[dumpCol]) : undefined,
            fuelCost: fuelCol >= 0 ? parseDecimal(row[fuelCol]) : undefined,
            totalDirectExpense: totalDirectCol >= 0 ? parseDecimal(row[totalDirectCol]) : undefined,
            totalIndirectExpense: totalIndirectCol >= 0 ? parseDecimal(row[totalIndirectCol]) : undefined,
            profit: profitCol >= 0 ? parseDecimal(row[profitCol]) : undefined,
            profitPercent: profitPctCol >= 0 ? parseDecimal(row[profitPctCol]) : undefined,
            amountPaid: paid,
            datePaid: paidDate,
            amountOwed: invoiceAmount && paid ? invoiceAmount - paid : undefined,
            jobCategory: category,
            sourceFile: filename,
            sourceYear: year,
          },
        });
        stats.jobCostingImported++;
        continue;
      }

      await prisma.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          jobType,
          jobCategory: category,
          projectStartDate: date,
          invoiceNumber: invoiceNum,
          invoiceAmount: invoiceAmount,
          estCrewWage: estWageCol >= 0 ? parseDecimal(row[estWageCol]) : null,
          estHours: estHrsCol >= 0 ? parseDecimal(row[estHrsCol]) : null,
          estCrewTotal: estCrewTotalCol >= 0 ? parseDecimal(row[estCrewTotalCol]) : null,
          crewWage: crewWageCol >= 0 ? parseDecimal(row[crewWageCol]) : null,
          actualHours: hoursCol >= 0 ? parseDecimal(row[hoursCol]) : null,
          crewTotal: crewTotalCol >= 0 ? parseDecimal(row[crewTotalCol]) : null,
          materialCost: materialCostCol >= 0 ? parseDecimal(row[materialCostCol]) : null,
          subCost: subCostCol >= 0 ? parseDecimal(row[subCostCol]) : null,
          dumpCost: dumpCol >= 0 ? parseDecimal(row[dumpCol]) : null,
          fuelCost: fuelCol >= 0 ? parseDecimal(row[fuelCol]) : null,
          totalDirectExpense: totalDirectCol >= 0 ? parseDecimal(row[totalDirectCol]) : null,
          totalIndirectExpense: totalIndirectCol >= 0 ? parseDecimal(row[totalIndirectCol]) : null,
          profit: profitCol >= 0 ? parseDecimal(row[profitCol]) : null,
          profitPercent: profitPctCol >= 0 ? parseDecimal(row[profitPctCol]) : null,
          amountPaid: paid,
          datePaid: paidDate,
          amountOwed: invoiceAmount && paid ? invoiceAmount - paid : null,
          percentCompleted: 100,
          status,
          dataSource: "EXCEL_IMPORT",
          sourceFile: filename,
          sourceYear: year,
        },
      });
      stats.jobCostingImported++;
    } catch (err) {
      console.error(`  ✗ Row ${i} error in ${filename}:`, (err as Error).message);
      stats.errors++;
    }
  }
}

// ── Import Subcontractor Files ──────────────────────────────

async function importSubcontractorFile(filePath: string, filename: string) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  const year = detectYear(filename);

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] as unknown[];
    if (!row) continue;
    const rowStr = row.map(String).join("|").toLowerCase();
    if (rowStr.includes("customer") && rowStr.includes("invoice")) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    stats.skipped++;
    return;
  }

  const headers = (rows[headerIdx] as unknown[]).map((c) => String(c ?? "").trim());

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length < 3) continue;

    const customerIdx = headers.findIndex((h) => /customer/i.test(h));
    const customerName = row[customerIdx];
    if (!customerName || typeof customerName !== "string") continue;
    const custStr = customerName.trim();
    if (!custStr || custStr.toLowerCase().includes("total")) continue;

    try {
      const customerId = await findOrCreateCustomer(custStr);
      const dateIdx = headers.findIndex((h) => /date/i.test(h));
      const date = dateIdx >= 0 ? excelDateToDate(row[dateIdx] as number) : null;
      const invoiceNumIdx = headers.findIndex((h) => /invoice\s*#/i.test(h));
      const invoiceNum = invoiceNumIdx >= 0 ? String(row[invoiceNumIdx] ?? "").trim() : null;
      const invoiceAmtIdx = headers.findIndex((h) => /invoice amount/i.test(h));
      const subAmtIdx = headers.findIndex((h) => /sub amount/i.test(h));
      const profitIdx = headers.findIndex((h) => /mcc profit|profit/i.test(h));
      const profitPctIdx = headers.findIndex((h) => /%\s*profit/i.test(h));

      const invoiceAmount = invoiceAmtIdx >= 0 ? parseDecimal(row[invoiceAmtIdx]) : null;
      const subAmount = subAmtIdx >= 0 ? parseDecimal(row[subAmtIdx]) : null;
      const profitAmt = profitIdx >= 0 ? parseDecimal(row[profitIdx]) : null;

      if (!invoiceAmount && !subAmount) continue; // skip empty rows

      const woNumber = invoiceNum && invoiceNum.startsWith("#")
        ? invoiceNum.replace("#", "")
        : generateHistoricalWO(year, "SUBCONTRACTOR");

      const existing = await prisma.workOrder.findUnique({ where: { workOrderNumber: woNumber } });
      if (existing) {
        await prisma.workOrder.update({
          where: { id: existing.id },
          data: {
            jobCategory: "SUBCONTRACTOR",
            subCost: subAmount,
            profit: profitAmt,
            profitPercent: profitPctIdx >= 0 ? parseDecimal(row[profitPctIdx]) : undefined,
            sourceFile: filename,
          },
        });
      } else {
        await prisma.workOrder.create({
          data: {
            workOrderNumber: woNumber,
            customerId,
            jobType: "Subcontractor",
            jobCategory: "SUBCONTRACTOR",
            projectStartDate: date,
            invoiceNumber: invoiceNum,
            invoiceAmount: invoiceAmount,
            subCost: subAmount,
            profit: profitAmt,
            profitPercent: profitPctIdx >= 0 ? parseDecimal(row[profitPctIdx]) : null,
            amountPaid: invoiceAmount,
            percentCompleted: 100,
            status: "PAID",
            dataSource: "EXCEL_IMPORT",
            sourceFile: filename,
            sourceYear: year,
          },
        });
      }
      stats.subcontractorImported++;
    } catch (err) {
      console.error(`  ✗ Sub row ${i} error:`, (err as Error).message);
      stats.errors++;
    }
  }
}

// ── Import Weekly Analysis Sheets ──────────────────────────

async function importWeeklyAnalysis(filePath: string, filename: string) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  const year = detectYear(filename);

  // Find header row (contains "Customer Name" and "Crew Size" or "Travel Hrs")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] as unknown[];
    if (!row) continue;
    const rowStr = row.map(String).join("|").toLowerCase();
    if (rowStr.includes("customer name") && (rowStr.includes("crew size") || rowStr.includes("travel"))) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    stats.skipped++;
    return;
  }

  const headers = (rows[headerIdx] as unknown[]).map((c) => String(c ?? "").trim());

  const customerIdx = headers.findIndex((h) => /customer name/i.test(h));
  const dateIdx = headers.findIndex((h) => /^date$/i.test(h));
  const descIdx = headers.findIndex((h) => /description/i.test(h));
  const crewSizeIdx = headers.findIndex((h) => /crew size/i.test(h));
  const estHrsIdx = headers.findIndex((h) => /^hrs$/i.test(h));
  // "Total Man Hrs" appears twice: first is estimated, second is actual
  const totalManHrsIndices = headers.reduce<number[]>((acc, h, i) => {
    if (/total man hrs/i.test(h)) acc.push(i);
    return acc;
  }, []);
  const estTotalIdx = totalManHrsIndices[0] ?? -1;
  const actTotalIdx = totalManHrsIndices[1] ?? -1;
  const travelIdx = headers.findIndex((h) => /travel/i.test(h));
  const jobTimeIdx = headers.findIndex((h) => /job time/i.test(h));
  const setupIdx = headers.findIndex((h) => /set up|setup/i.test(h));
  const profitPctIdx = headers.findIndex((h) => /profit/i.test(h));

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.length < 3) continue;

    const customerName = row[customerIdx];
    if (!customerName || typeof customerName !== "string") continue;
    const custStr = customerName.trim();
    if (!custStr) continue;

    try {
      const customerId = await findOrCreateCustomer(custStr);
      const date = dateIdx >= 0 ? excelDateToDate(row[dateIdx] as number) : null;
      const desc = descIdx >= 0 ? String(row[descIdx] ?? "").trim() : "Weekly Analysis";
      const woNumber = generateHistoricalWO(year, "WA");

      await prisma.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          jobType: desc || "Weekly Analysis",
          jobCategory: detectCategory(desc),
          projectStartDate: date,
          estCrewSize: crewSizeIdx >= 0 ? parseDecimal(row[crewSizeIdx]) ? Math.round(parseDecimal(row[crewSizeIdx])!) : null : null,
          estHours: estHrsIdx >= 0 ? parseDecimal(row[estHrsIdx]) : null,
          estTotalManHours: estTotalIdx >= 0 ? parseDecimal(row[estTotalIdx]) : null,
          actualTravelHours: travelIdx >= 0 ? parseDecimal(row[travelIdx]) : null,
          actualJobTime: jobTimeIdx >= 0 ? parseDecimal(row[jobTimeIdx]) : null,
          actualSetupUnload: setupIdx >= 0 ? parseDecimal(row[setupIdx]) : null,
          actualTotalManHours: actTotalIdx >= 0 ? parseDecimal(row[actTotalIdx]) : null,
          profitPercent: profitPctIdx >= 0 ? parseDecimal(row[profitPctIdx]) : null,
          percentCompleted: 100,
          status: "COMPLETED",
          dataSource: "EXCEL_IMPORT",
          sourceFile: filename,
          sourceYear: year,
        },
      });
      stats.weeklyAnalysisImported++;
    } catch (err) {
      console.error(`  ✗ Weekly row ${i} error:`, (err as Error).message);
      stats.errors++;
    }
  }
}

// ── Import MCC App Export (2023) ──────────────────────────

async function importMCCAppExport(filePath: string, filename: string) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  for (const row of rows) {
    const customerName = String(row["Customer"] ?? "").trim();
    if (!customerName || customerName.toLowerCase().includes("total")) continue;

    try {
      const customerId = await findOrCreateCustomer(customerName);
      const invoiceNum = String(row["Invoice Number"] ?? "").trim();
      const woNumber = invoiceNum.startsWith("#") ? invoiceNum.replace("#", "") : generateHistoricalWO(2023, "APP");

      const existing = await prisma.workOrder.findUnique({ where: { workOrderNumber: woNumber } });
      if (existing) {
        // Update existing Zoho-imported records with financial data
        await prisma.workOrder.update({
          where: { id: existing.id },
          data: {
            invoiceNumber: invoiceNum || undefined,
            invoiceAmount: parseDecimal(row["LS Amount"]),
            estCrewTotal: parseDecimal(row["EST Crew Total"]),
            crewTotal: parseDecimal(row["Crew Total"]),
            materialCost: parseDecimal(row["Material Cost"]),
            fuelCost: parseDecimal(row["Fuel"]),
            dumpCost: parseDecimal(row["Dump"]),
            totalDirectExpense: parseDecimal(row["Total Direct Expense"]),
            totalIndirectExpense: parseDecimal(row["Total Indirect Expense"]),
            profit: parseDecimal(row["Profit"]),
            amountPaid: parseDecimal(row["Paid"]),
            datePaid: excelDateToDate(row["Date Paid"] as number),
            amountOwed: parseDecimal(row["Formula"]),
            sourceFile: filename,
          },
        });
        stats.jobCostingImported++;
        continue;
      }

      const date = excelDateToDate(row["Date"] as number);
      await prisma.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          jobType: String(row["Type of Job"] ?? "Landscape").trim(),
          jobCategory: "LANDSCAPE",
          projectStartDate: date,
          invoiceNumber: invoiceNum,
          invoiceAmount: parseDecimal(row["LS Amount"]),
          estCrewTotal: parseDecimal(row["EST Crew Total"]),
          crewTotal: parseDecimal(row["Crew Total"]),
          materialCost: parseDecimal(row["Material Cost"]),
          fuelCost: parseDecimal(row["Fuel"]),
          dumpCost: parseDecimal(row["Dump"]),
          totalDirectExpense: parseDecimal(row["Total Direct Expense"]),
          totalIndirectExpense: parseDecimal(row["Total Indirect Expense"]),
          profit: parseDecimal(row["Profit"]),
          amountPaid: parseDecimal(row["Paid"]),
          datePaid: excelDateToDate(row["Date Paid"] as number),
          amountOwed: parseDecimal(row["Formula"]),
          percentCompleted: 100,
          status: "PAID",
          dataSource: "EXCEL_IMPORT",
          sourceFile: filename,
          sourceYear: 2023,
        },
      });
      stats.jobCostingImported++;
    } catch (err) {
      console.error(`  ✗ MCC App row error:`, (err as Error).message);
      stats.errors++;
    }
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  MCC Historical Data Import");
  console.log("═══════════════════════════════════════════════\n");

  const files = fs.readdirSync(EXTRACT_DIR).filter((f) => /\.(xls|xlsx)$/i.test(f));
  console.log(`Found ${files.length} Excel files to process\n`);

  // Classify files
  const jobCostingFiles: string[] = [];
  const subcontractorFiles: string[] = [];
  const weeklyAnalysisFiles: string[] = [];
  const mccAppFiles: string[] = [];
  const shopFiles: string[] = [];
  const templateFiles: string[] = [];
  const zohoExportFiles: string[] = [];

  for (const f of files) {
    const lower = f.toLowerCase();
    if (lower.includes("template") || lower.includes("anaylsis forms")) {
      templateFiles.push(f);
    } else if (lower.includes("shop")) {
      shopFiles.push(f);
    } else if (lower.includes("subcontractor")) {
      subcontractorFiles.push(f);
    } else if (lower.includes("mcc app") || lower.includes("job costing figures")) {
      mccAppFiles.push(f);
    } else if (lower.includes("landscaping jobs")) {
      zohoExportFiles.push(f);
    } else if (lower.includes("job costing")) {
      jobCostingFiles.push(f);
    } else if (
      lower.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
      lower.includes("threw") ||
      lower.includes("thrwe") ||
      lower.includes("therw")
    ) {
      weeklyAnalysisFiles.push(f);
    } else {
      console.log(`  ? Unclassified: ${f}`);
    }
  }

  console.log(`Classification:`);
  console.log(`  Job Costing:      ${jobCostingFiles.length} files`);
  console.log(`  Subcontractors:   ${subcontractorFiles.length} files`);
  console.log(`  Weekly Analysis:  ${weeklyAnalysisFiles.length} files`);
  console.log(`  MCC App Export:   ${mccAppFiles.length} files`);
  console.log(`  Zoho Export:      ${zohoExportFiles.length} files`);
  console.log(`  Shop Time:        ${shopFiles.length} files (skipping - unstructured)`);
  console.log(`  Templates:        ${templateFiles.length} files (skipping)\n`);

  // 1. Import job costing files
  console.log("── Importing Job Costing Files ──");
  for (const f of jobCostingFiles.sort()) {
    console.log(`  📄 ${f}`);
    await importJobCostingFile(path.join(EXTRACT_DIR, f), f);
    stats.filesProcessed++;
  }

  // 2. Import subcontractor files
  console.log("\n── Importing Subcontractor Files ──");
  for (const f of subcontractorFiles.sort()) {
    console.log(`  📄 ${f}`);
    await importSubcontractorFile(path.join(EXTRACT_DIR, f), f);
    stats.filesProcessed++;
  }

  // 3. Import weekly analysis
  console.log("\n── Importing Weekly Analysis Sheets ──");
  for (const f of weeklyAnalysisFiles.sort()) {
    console.log(`  📄 ${f}`);
    await importWeeklyAnalysis(path.join(EXTRACT_DIR, f), f);
    stats.filesProcessed++;
  }

  // 4. Import MCC App export
  console.log("\n── Importing MCC App Export ──");
  for (const f of mccAppFiles) {
    console.log(`  📄 ${f}`);
    await importMCCAppExport(path.join(EXTRACT_DIR, f), f);
    stats.filesProcessed++;
  }

  // 5. Zoho export (2022 Landscaping Jobs) - skip if data already imported via import-zoho.ts
  if (zohoExportFiles.length > 0) {
    console.log("\n── Zoho Export Files ──");
    console.log("  ℹ Skipping - use scripts/import-zoho.ts for full Zoho imports");
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════");
  console.log("  Import Complete");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Files processed:       ${stats.filesProcessed}`);
  console.log(`  Job costing records:   ${stats.jobCostingImported}`);
  console.log(`  Weekly analysis:       ${stats.weeklyAnalysisImported}`);
  console.log(`  Subcontractor records: ${stats.subcontractorImported}`);
  console.log(`  Customers created:     ${stats.customersCreated}`);
  console.log(`  Skipped files:         ${stats.skipped}`);
  console.log(`  Errors:                ${stats.errors}`);

  // Update existing Zoho records to mark their data source
  const updated = await prisma.workOrder.updateMany({
    where: { dataSource: "MANUAL", workOrderNumber: { startsWith: "23-" } },
    data: { dataSource: "ZOHO" },
  });
  console.log(`\n  Tagged ${updated.count} existing records as ZOHO source`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
