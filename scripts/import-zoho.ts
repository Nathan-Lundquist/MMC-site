/**
 * Import Zoho Creator work orders into the new system.
 * Run: npx tsx scripts/import-zoho.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface ZohoRecord {
  Type_of_Job: string;
  Landscaping_Job_Number: string;
  Project_Start_Date: string;
  Customers: string;
  Percent_Completed: string;
  Work_Order_Number: string;
  Material_Services_not_used_or_performed_from_w_o_List: string;
  Foreman: string;
  ID: string;
  Notes: string;
  Project_End_Date: string;
  Total_Man_Hours: string;
}

/** Parse "24-Nov-2025" → Date */
function parseZohoDate(s: string): Date | null {
  if (!s || !s.trim()) return null;
  const d = new Date(s.replace(/-/g, " "));
  return isNaN(d.getTime()) ? null : d;
}

/** Normalize foreman name — trim extra spaces */
function normalizeName(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Derive status from percent complete */
function deriveStatus(pct: number): "DRAFT" | "IN_PROGRESS" | "COMPLETED" {
  if (pct >= 100) return "COMPLETED";
  if (pct > 0) return "IN_PROGRESS";
  return "DRAFT";
}

async function main() {
  const filePath = path.join(__dirname, "../data/zoho-export.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const records: ZohoRecord[] = raw.all;

  console.log(`Loaded ${records.length} Zoho records`);

  // ── Step 1: Create unique customers ──────────────────────
  const customerNames = new Set<string>();
  for (const r of records) {
    const name = r.Customers?.trim();
    if (name) customerNames.add(name);
  }

  console.log(`Creating ${customerNames.size} customers...`);
  const customerMap = new Map<string, string>(); // name → id

  for (const name of customerNames) {
    const existing = await prisma.customer.findFirst({ where: { name } });
    if (existing) {
      customerMap.set(name, existing.id);
    } else {
      const c = await prisma.customer.create({ data: { name } });
      customerMap.set(name, c.id);
    }
  }
  console.log(`  ✓ ${customerMap.size} customers ready`);

  // ── Step 2: Create unique employees (foremen) ────────────
  const foremanNames = new Set<string>();
  for (const r of records) {
    const name = normalizeName(r.Foreman || "");
    if (name && name !== "Subcontractor - Foreman") foremanNames.add(name);
  }

  console.log(`Creating ${foremanNames.size} foremen...`);
  const employeeMap = new Map<string, string>(); // name → id

  for (const name of foremanNames) {
    const existing = await prisma.employee.findFirst({ where: { name } });
    if (existing) {
      employeeMap.set(name, existing.id);
    } else {
      // Generate a placeholder email from the name
      const email = name
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\s+/g, ".")
        + "@mmc.local";
      const e = await prisma.employee.create({
        data: {
          name,
          email,
          role: "FOREMAN",
          passwordHash: "IMPORTED_NO_LOGIN",
          active: true,
        },
      });
      employeeMap.set(name, e.id);
    }
  }
  console.log(`  ✓ ${employeeMap.size} foremen ready`);

  // ── Step 3: Import work orders ───────────────────────────
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const r of records) {
    const customerName = r.Customers?.trim();
    const foremanName = normalizeName(r.Foreman || "");
    const customerId = customerMap.get(customerName);

    if (!customerId) {
      console.warn(`  ⚠ No customer for "${customerName}", skipping`);
      skipped++;
      continue;
    }

    // Handle WO number — use Zoho job number as fallback, or generate one
    let woNumber = r.Work_Order_Number?.trim();
    if (!woNumber) {
      woNumber = `Z-${r.Landscaping_Job_Number || r.ID}`;
    }
    // Handle multi-WO (newline separated) — take the first one
    if (woNumber.includes("\n")) {
      woNumber = woNumber.split("\n")[0].trim();
    }

    // Check for duplicate
    const existing = await prisma.workOrder.findUnique({
      where: { workOrderNumber: woNumber },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const pct = parseFloat(r.Percent_Completed) || 0;
    const foremanId =
      foremanName && foremanName !== "Subcontractor - Foreman"
        ? employeeMap.get(foremanName) || null
        : null;

    try {
      await prisma.workOrder.create({
        data: {
          workOrderNumber: woNumber,
          customerId,
          foremanId,
          jobType: r.Type_of_Job?.trim() || "General",
          projectStartDate: parseZohoDate(r.Project_Start_Date),
          projectEndDate: parseZohoDate(r.Project_End_Date),
          percentCompleted: pct,
          totalManHours: parseFloat(r.Total_Man_Hours) || 0,
          notes: r.Notes?.trim() || null,
          materialsNotUsed:
            r.Material_Services_not_used_or_performed_from_w_o_List?.trim() ||
            null,
          status: deriveStatus(pct),
        },
      });
      created++;
    } catch (err) {
      console.error(`  ✗ Failed WO "${woNumber}":`, (err as Error).message);
      errors++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (duplicate/no customer): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
