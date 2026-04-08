/**
 * Import detailed Zoho XLSX export into the database.
 * Updates existing work orders (matched by WO number) with sub-records.
 * Run: npx tsx scripts/import-xlsx.ts
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

// ── Parse the XLSX using Python (openpyxl) → JSON ─────────

function loadXlsx(): Record<string, string | number | null>[] {
  const json = execSync(
    `python3 -c "
import openpyxl, json, datetime

wb = openpyxl.load_workbook('/home/nathan/projects/mmc-next/data/data.xlsx', data_only=True)
ws = wb['all']
headers = [cell.value for cell in ws[1]]
rows = []
for row_idx in range(2, ws.max_row + 1):
    row = {}
    for i, h in enumerate(headers):
        if not h: continue
        val = ws.cell(row=row_idx, column=i+1).value
        if isinstance(val, datetime.datetime):
            row[h] = val.strftime('%Y-%m-%d')
        elif val is None:
            row[h] = ''
        else:
            row[h] = str(val) if not isinstance(val, (int, float)) else val
    rows.append(row)
print(json.dumps(rows))
"`,
    { maxBuffer: 50 * 1024 * 1024 }
  ).toString();
  return JSON.parse(json);
}

// ── Parsers for Zoho text fields ───────────────────────────

function parseDate(s: string): Date | null {
  if (!s?.trim()) return null;
  // "24-Nov-2025" or "2025-11-24"
  const d = new Date(s.replace(/-/g, " "));
  return isNaN(d.getTime()) ? null : d;
}

function normName(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Time entries: "24-Nov-2025 12:49:21 24-Nov-2025 13:58:30"
 * Can have multiple entries separated by commas
 */
function parseTimeEntries(raw: string) {
  if (!raw?.trim()) return [];
  // Pattern: DD-Mon-YYYY HH:MM:SS DD-Mon-YYYY HH:MM:SS
  const pattern =
    /(\d{1,2}-\w{3}-\d{4})\s+(\d{1,2}:\d{2}:\d{2})\s+(\d{1,2}-\w{3}-\d{4})\s+(\d{1,2}:\d{2}:\d{2})/g;
  const entries: { startTime: Date; endTime: Date | null }[] = [];
  let m;
  while ((m = pattern.exec(raw)) !== null) {
    const start = new Date(`${m[1].replace(/-/g, " ")} ${m[2]}`);
    const end = new Date(`${m[3].replace(/-/g, " ")} ${m[4]}`);
    if (!isNaN(start.getTime())) {
      entries.push({
        startTime: start,
        endTime: isNaN(end.getTime()) ? null : end,
      });
    }
  }
  return entries;
}

/**
 * Payments: "27-Oct-2025 1000.00 1718" or "03-Oct-2025 1246.00 2686,03-Oct-2025 500.00"
 * Format: date amount [checkNumber]
 */
function parsePayments(raw: string) {
  if (!raw?.trim()) return [];
  const parts = raw.split(",");
  const payments: { date: Date; amount: number; checkNumber: string | null }[] =
    [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Match: DD-Mon-YYYY amount [checkNumber]
    const m = trimmed.match(
      /(\d{1,2}-\w{3}-\d{4})\s+([\d.]+)(?:\s+(\S+))?/
    );
    if (m) {
      const date = new Date(m[1].replace(/-/g, " "));
      if (!isNaN(date.getTime())) {
        payments.push({
          date,
          amount: parseFloat(m[2]) || 0,
          checkNumber: m[3] || null,
        });
      }
    }
  }
  return payments;
}

/**
 * Machines: "2019 Avant 640 2.00" or "2022 Cat 289 Skid Steer 6.30,2021 Cat 302.5 Mini Excavator 5.70"
 * Format: vehicleInfo hours (last number is hours)
 */
function parseMachines(raw: string) {
  if (!raw?.trim()) return [];
  const parts = raw.split(",");
  const machines: { vehicleInfo: string; hours: number }[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Last number is hours
    const m = trimmed.match(/^(.+?)\s+([\d.]+)\s*$/);
    if (m) {
      machines.push({
        vehicleInfo: m[1].trim(),
        hours: parseFloat(m[2]) || 0,
      });
    }
  }
  return machines;
}

/**
 * Crew Details - comma-separated format where commas separate BOTH
 * employees in a group AND groups themselves.
 *
 * A "group" starts with a date entry and ends with an entry that has 4 numbers + username.
 * Everything between is employee names sharing the same hours.
 *
 * Examples:
 *   "24-Nov-2025 0.00    Jordan  Galazka Jr.  ,    Alan Palmiter   1.14 0.08 0.16 0.00 c.reynolds"
 *   → group of 2 employees (Jordan + Alan) both get 1.14/0.08/0.16/0.00
 *
 *   "20-Nov-2025 0.00    Jordan  Galazka Jr.  ,    Chase  Reynolds  ,    Steve  Mayes  ,    Alan Palmiter   6.00 0.75 1.25 0.15 c.reynolds"
 *   → group of 4 employees all get 6.00/0.75/1.25/0.15
 *
 * The hours pattern at end: jobHours setupHours travelHours deliveryHours username
 * The date line: DD-Mon-YYYY deliveryFromDate  Name
 */
function parseCrewDetails(
  raw: string,
  employeeMap: Map<string, string>
) {
  if (!raw?.trim()) return [];

  const parts = raw.split(",");
  const results: {
    date: Date;
    employeeId: string | null;
    jobHours: number;
    setupHours: number;
    travelHours: number;
    unloadHours: number;
    deliveryHours: number;
  }[] = [];

  let currentDate: Date | null = null;
  let currentGroupNames: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Pattern 1: Date line — "24-Nov-2025 0.00    Jordan  Galazka Jr."
    const dateMatch = trimmed.match(
      /^(\d{1,2}-\w{3}-\d{4})\s+[\d.]+\s+(.+)$/
    );

    // Pattern 2: Last in group with hours — "Alan Palmiter   1.14 0.08 0.16 0.00 c.reynolds"
    // Must have 4 decimal numbers followed by a username (word.word or word)
    const hoursMatch = trimmed.match(
      /^(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+\S+\.\S+\s*$/
    );

    // Pattern 3: Last in group — "Name   jobHours setupHours travelHours deliveryHours username"
    // where username has no dot (like just "c")
    const hoursMatch2 = !hoursMatch
      ? trimmed.match(
          /^(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+\S+\s*$/
        )
      : null;

    const hm = hoursMatch || hoursMatch2;

    if (dateMatch) {
      // New date group — flush previous if incomplete
      if (currentGroupNames.length > 0) {
        for (const empName of currentGroupNames) {
          results.push({
            date: currentDate || new Date(),
            employeeId: employeeMap.get(empName) || null,
            jobHours: 0, setupHours: 0, travelHours: 0, unloadHours: 0, deliveryHours: 0,
          });
        }
      }
      currentDate = new Date(dateMatch[1].replace(/-/g, " "));
      const name = normName(dateMatch[2]);
      // Check if this date line ALSO has hours (single-person entry)
      const singleMatch = dateMatch[2].match(
        /^(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+\S+/
      );
      if (singleMatch) {
        const empName = normName(singleMatch[1]);
        results.push({
          date: currentDate,
          employeeId: employeeMap.get(empName) || null,
          jobHours: parseFloat(singleMatch[2]) || 0,
          setupHours: parseFloat(singleMatch[3]) || 0,
          travelHours: parseFloat(singleMatch[4]) || 0,
          unloadHours: 0,
          deliveryHours: parseFloat(singleMatch[5]) || 0,
        });
        currentGroupNames = [];
      } else {
        currentGroupNames = [name];
      }
    } else if (hm) {
      // Last in group — has hours
      const name = normName(hm[1]);
      currentGroupNames.push(name);

      const jobHours = parseFloat(hm[2]) || 0;
      const setupHours = parseFloat(hm[3]) || 0;
      const travelHours = parseFloat(hm[4]) || 0;
      const deliveryHours = parseFloat(hm[5]) || 0;

      for (const empName of currentGroupNames) {
        results.push({
          date: currentDate || new Date(),
          employeeId: employeeMap.get(empName) || null,
          jobHours, setupHours, travelHours, unloadHours: 0, deliveryHours,
        });
      }
      currentGroupNames = [];
    } else {
      // Just a name — middle of a group
      const name = normName(trimmed);
      if (name) currentGroupNames.push(name);
    }
  }

  // Flush remaining
  for (const empName of currentGroupNames) {
    results.push({
      date: currentDate || new Date(),
      employeeId: employeeMap.get(empName) || null,
      jobHours: 0, setupHours: 0, travelHours: 0, unloadHours: 0, deliveryHours: 0,
    });
  }

  return results;
}

/**
 * MCC Materials: "Concrete mix (60lbs) 1.50 Bags,Beige Poly sand 3.00 Lbs"
 * Format: material qty units
 */
function parseMaterials(raw: string) {
  if (!raw?.trim()) return [];
  const parts = raw.split(",");
  const materials: { material: string; qty: number; units: string | null }[] =
    [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Match: material qty units (units is a word at end, qty is a number before it)
    const m = trimmed.match(/^(.+?)\s+([\d.]+)\s+(\S+)\s*$/);
    if (m) {
      materials.push({
        material: m[1].trim(),
        qty: parseFloat(m[2]) || 0,
        units: m[3] || null,
      });
    } else {
      // Try without units
      const m2 = trimmed.match(/^(.+?)\s+([\d.]+)\s*$/);
      if (m2) {
        materials.push({
          material: m2[1].trim(),
          qty: parseFloat(m2[2]) || 0,
          units: null,
        });
      }
    }
  }
  return materials;
}

/**
 * Outsourced: "bedrock  95.29 21aa washed 44.95 2.00 Yes Yards"
 * Format: supplier cost material perUnitCost qty taxIncluded units
 * This is tricky — supplier and material names can contain spaces
 * Pattern: supplier totalCost material perUnitCost qty Yes/No units
 */
function parseOutsourced(raw: string) {
  if (!raw?.trim()) return [];
  const parts = raw.split(",");
  const results: {
    supplier: string;
    material: string;
    qty: number;
    unit: string | null;
    cost: number | null;
    perUnitCost: number | null;
    taxIncluded: boolean;
  }[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Try pattern: supplier cost material perUnitCost qty Yes/No units
    // e.g. "bedrock  95.29 21aa washed 44.95 2.00 Yes Yards"
    const m = trimmed.match(
      /^(.+?)\s+([\d.]+)\s+(.+?)\s+([\d.]+)\s+([\d.]+)\s+(Yes|No)\s+(\S+)\s*$/i
    );
    if (m) {
      results.push({
        supplier: m[1].trim(),
        material: m[3].trim(),
        qty: parseFloat(m[5]) || 0,
        unit: m[7] || null,
        cost: parseFloat(m[2]) || null,
        perUnitCost: parseFloat(m[4]) || null,
        taxIncluded: m[6].toLowerCase() === "yes",
      });
      continue;
    }

    // Simpler pattern without tax/units: "CPC Tree stakes 70.00  Pieces"
    const m2 = trimmed.match(/^(.+?)\s+([\d.]+)\s+(\S+)\s*$/);
    if (m2) {
      results.push({
        supplier: "",
        material: m2[1].trim(),
        qty: parseFloat(m2[2]) || 0,
        unit: m2[3] || null,
        cost: null,
        perUnitCost: null,
        taxIncluded: false,
      });
      continue;
    }

    // Fallback — just store the whole thing as material
    results.push({
      supplier: "",
      material: trimmed,
      qty: 0,
      unit: null,
      cost: null,
      perUnitCost: null,
      taxIncluded: false,
    });
  }

  return results;
}

/**
 * Additional Work Description: "1 21-Nov-2025 Customer Approved Fall clean up of neighbors pile"
 * Format: number date status typeOfWork
 */
function parseAdditionalWork(raw: string) {
  if (!raw?.trim()) return [];
  const parts = raw.split(",");
  const results: {
    number: number | null;
    date: Date | null;
    status: string | null;
    typeOfWork: string | null;
  }[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const m = trimmed.match(
      /^(\d+)\s+(\d{1,2}-\w{3}-\d{4})\s+(Customer Approved|Pending|Denied)?\s*(.*)$/i
    );
    if (m) {
      results.push({
        number: parseInt(m[1]),
        date: new Date(m[2].replace(/-/g, " ")),
        status: m[3] || null,
        typeOfWork: m[4]?.trim() || null,
      });
    }
  }
  return results;
}

/**
 * Additional Work Crew: "1 21-Nov-2025 0.00    Jordan  Galazka Jr.  ,    Chase  Reynolds   0.16"
 * Similar to regular crew but with a number prefix and only jobHours at end
 */
function parseAdditionalCrew(
  raw: string,
  employeeMap: Map<string, string>
) {
  if (!raw?.trim()) return [];
  const parts = raw.split(",");
  const results: {
    number: number | null;
    date: Date | null;
    employeeId: string | null;
    jobHours: number;
    deliveryHours: number;
  }[] = [];

  let currentNumber: number | null = null;
  let currentDate: Date | null = null;
  let currentGroupNames: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Entry with number + date: "1 21-Nov-2025 0.00    Name"
    const dateMatch = trimmed.match(
      /^(\d+)\s+(\d{1,2}-\w{3}-\d{4})\s+[\d.]+\s+(.+)$/
    );

    if (dateMatch) {
      // Flush previous group
      if (currentGroupNames.length > 0) {
        for (const empName of currentGroupNames) {
          results.push({
            number: currentNumber, date: currentDate,
            employeeId: employeeMap.get(empName) || null,
            jobHours: 0, deliveryHours: 0,
          });
        }
      }
      currentNumber = parseInt(dateMatch[1]);
      currentDate = new Date(dateMatch[2].replace(/-/g, " "));
      const nameRaw = dateMatch[3];
      // Check if name has hours at end
      const withHours = nameRaw.match(/^(.+?)\s+([\d.]+)\s*$/);
      if (withHours) {
        const name = normName(withHours[1]);
        results.push({
          number: currentNumber, date: currentDate,
          employeeId: employeeMap.get(name) || null,
          jobHours: parseFloat(withHours[2]) || 0, deliveryHours: 0,
        });
        currentGroupNames = [];
      } else {
        currentGroupNames = [normName(nameRaw)];
      }
    } else {
      // Name, possibly with hours at end
      const withHours = trimmed.match(/^(.+?)\s+([\d.]+)\s*$/);
      if (withHours) {
        const name = normName(withHours[1]);
        const hours = parseFloat(withHours[2]) || 0;
        currentGroupNames.push(name);
        // This closes the group
        for (const empName of currentGroupNames) {
          results.push({
            number: currentNumber, date: currentDate,
            employeeId: employeeMap.get(empName) || null,
            jobHours: hours, deliveryHours: 0,
          });
        }
        currentGroupNames = [];
      } else {
        currentGroupNames.push(normName(trimmed));
      }
    }
  }

  // Flush remaining
  for (const empName of currentGroupNames) {
    results.push({
      number: currentNumber, date: currentDate,
      employeeId: employeeMap.get(empName) || null,
      jobHours: 0, deliveryHours: 0,
    });
  }

  return results;
}

// ── Main import ────────────────────────────────────────────

async function main() {
  const rows = loadXlsx();
  console.log(`Loaded ${rows.length} XLSX rows`);

  // Build employee name → id map
  const allEmployees = await prisma.employee.findMany();
  const employeeMap = new Map<string, string>();
  for (const emp of allEmployees) {
    employeeMap.set(emp.name, emp.id);
    // Also map without extra spaces
    employeeMap.set(normName(emp.name), emp.id);
  }

  // Track new employee names we encounter
  const newEmployeeNames = new Set<string>();

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const woNumber = String(row["Work Order Number"] || "").trim();
    if (!woNumber) {
      skipped++;
      continue;
    }

    const wo = await prisma.workOrder.findUnique({
      where: { workOrderNumber: woNumber },
    });
    if (!wo) {
      console.warn(`  ⚠ WO "${woNumber}" not in DB, skipping`);
      skipped++;
      continue;
    }

    try {
      // Collect employee names from crew data first
      const crewRaw = String(row["Crew Details"] || "");
      const addlCrewRaw = String(
        row["Approved / Additional Work Crew Details (2/4)"] || ""
      );
      for (const rawStr of [crewRaw, addlCrewRaw]) {
        const names = rawStr
          .split(",")
          .map((p) => {
            const trimmed = p.trim();
            if (!trimmed) return "";

            // Extract name — strip date prefix, hours suffix, and username suffix
            let name = trimmed;

            // Remove leading date: "24-Nov-2025 0.00 "
            name = name.replace(/^\d{1,2}-\w{3}-\d{4}\s+[\d.]+\s+/, "");
            // Remove leading number+date (addl work): "1 24-Nov-2025 0.00 "
            name = name.replace(/^\d+\s+\d{1,2}-\w{3}-\d{4}\s+[\d.]+\s+/, "");
            // Remove trailing hours + username: "1.14 0.08 0.16 0.00 c.reynolds"
            name = name.replace(/\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+\S+\s*$/, "");
            // Remove trailing single number + nothing (addl crew): "0.16"
            name = name.replace(/\s+[\d.]+\s*$/, "");

            return normName(name);
          })
          .filter((n) => n && !n.match(/^\d/) && n.length > 1);

        for (const name of names) {
          if (!employeeMap.has(name)) {
            newEmployeeNames.add(name);
          }
        }
      }

      // Create any new employees we found
      for (const name of newEmployeeNames) {
        if (employeeMap.has(name)) continue;
        const email =
          name
            .toLowerCase()
            .replace(/[^a-z\s]/g, "")
            .replace(/\s+/g, ".") + "@mmc.local";

        // Check if email already exists
        const existing = await prisma.employee.findFirst({
          where: { OR: [{ name }, { email }] },
        });
        if (existing) {
          employeeMap.set(name, existing.id);
          continue;
        }

        const emp = await prisma.employee.create({
          data: {
            name,
            email,
            role: "CREW",
            passwordHash: "IMPORTED_NO_LOGIN",
            active: true,
          },
        });
        employeeMap.set(name, emp.id);
        console.log(`  + Created employee: ${name}`);
      }

      // Parse all sub-records
      const timeEntries = parseTimeEntries(
        String(row["Day/Times of Project"] || "")
      );
      const payments = parsePayments(
        String(row["Recived Payment or Deposit"] || "")
      );
      const machines = parseMachines(String(row["Machines"] || ""));
      const crewDetails = parseCrewDetails(crewRaw, employeeMap);
      const materials = parseMaterials(String(row["MCC Materials"] || ""));
      const outsourced = parseOutsourced(
        String(row["Out Sourced Material"] || "")
      );
      const addlWork = parseAdditionalWork(
        String(
          row["Approved / Additional Work Description (1/4)"] || ""
        )
      );
      const addlCrew = parseAdditionalCrew(addlCrewRaw, employeeMap);
      const addlMaterials = parseMaterials(
        String(
          row["Approved / Additional Work MCC Materials (3/4)"] || ""
        )
      );
      const addlOutsourced = parseOutsourced(
        String(
          row["Approved / Additional Work Out Sorced Materials (4/4)"] || ""
        )
      );

      const hasSubs =
        timeEntries.length > 0 ||
        payments.length > 0 ||
        machines.length > 0 ||
        crewDetails.length > 0 ||
        materials.length > 0 ||
        outsourced.length > 0 ||
        addlWork.length > 0;

      if (!hasSubs) {
        skipped++;
        continue;
      }

      // Delete existing sub-records and re-create
      await prisma.$transaction(async (tx) => {
        await Promise.all([
          tx.timeEntry.deleteMany({ where: { workOrderId: wo.id } }),
          tx.payment.deleteMany({ where: { workOrderId: wo.id } }),
          tx.machine.deleteMany({ where: { workOrderId: wo.id } }),
          tx.crewDetail.deleteMany({ where: { workOrderId: wo.id } }),
          tx.material.deleteMany({ where: { workOrderId: wo.id } }),
          tx.outsourcedMaterial.deleteMany({ where: { workOrderId: wo.id } }),
          tx.additionalWork.deleteMany({ where: { workOrderId: wo.id } }),
        ]);

        // Time entries
        if (timeEntries.length > 0) {
          await tx.timeEntry.createMany({
            data: timeEntries.map((t) => ({
              workOrderId: wo.id,
              startTime: t.startTime,
              endTime: t.endTime,
            })),
          });
        }

        // Payments
        if (payments.length > 0) {
          await tx.payment.createMany({
            data: payments.map((p) => ({
              workOrderId: wo.id,
              date: p.date,
              amount: p.amount,
              checkNumber: p.checkNumber,
            })),
          });
        }

        // Machines
        if (machines.length > 0) {
          await tx.machine.createMany({
            data: machines.map((m) => ({
              workOrderId: wo.id,
              vehicleInfo: m.vehicleInfo,
              hours: m.hours,
            })),
          });
        }

        // Crew details
        if (crewDetails.length > 0) {
          await tx.crewDetail.createMany({
            data: crewDetails.map((c) => ({
              workOrderId: wo.id,
              date: c.date,
              employeeId: c.employeeId,
              jobHours: c.jobHours,
              setupHours: c.setupHours,
              travelHours: c.travelHours,
              unloadHours: c.unloadHours,
              deliveryHours: c.deliveryHours,
            })),
          });
        }

        // MCC Materials
        if (materials.length > 0) {
          await tx.material.createMany({
            data: materials.map((m) => ({
              workOrderId: wo.id,
              material: m.material,
              qty: m.qty,
              units: m.units,
            })),
          });
        }

        // Outsourced materials
        if (outsourced.length > 0) {
          await tx.outsourcedMaterial.createMany({
            data: outsourced.map((m) => ({
              workOrderId: wo.id,
              supplier: m.supplier,
              material: m.material,
              qty: m.qty,
              unit: m.unit,
              cost: m.cost,
              perUnitCost: m.perUnitCost,
              taxIncluded: m.taxIncluded,
            })),
          });
        }

        // Additional work
        if (addlWork.length > 0) {
          for (const aw of addlWork) {
            const matchedCrew = addlCrew.filter(
              (c) => c.number === aw.number
            );
            const isFirst = aw.number === addlWork[0]?.number;

            await tx.additionalWork.create({
              data: {
                workOrderId: wo.id,
                number: aw.number,
                date: aw.date,
                status: aw.status,
                typeOfWork: aw.typeOfWork,
                crewDetails: {
                  create: matchedCrew.map((c) => ({
                    number: c.number,
                    date: c.date,
                    employeeId: c.employeeId,
                    jobHours: c.jobHours,
                    deliveryHours: c.deliveryHours,
                  })),
                },
                materials: {
                  create: isFirst
                    ? [
                        ...addlMaterials.map((m) => ({
                          material: m.material,
                          qty: m.qty,
                          units: m.units,
                          isOutsourced: false,
                        })),
                        ...addlOutsourced.map((m) => ({
                          material: m.material,
                          qty: m.qty,
                          units: m.unit,
                          isOutsourced: true,
                          supplier: m.supplier,
                          cost: m.cost,
                          perUnitCost: m.perUnitCost,
                        })),
                      ]
                    : [],
                },
              },
            });
          }
        }
      });

      updated++;
    } catch (err) {
      console.error(
        `  ✗ Failed WO "${woNumber}":`,
        (err as Error).message
      );
      errors++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);

  // Final counts
  const counts = await Promise.all([
    prisma.timeEntry.count(),
    prisma.payment.count(),
    prisma.machine.count(),
    prisma.crewDetail.count(),
    prisma.material.count(),
    prisma.outsourcedMaterial.count(),
    prisma.additionalWork.count(),
  ]);
  console.log(`\nDB totals:`);
  console.log(`  Time entries: ${counts[0]}`);
  console.log(`  Payments: ${counts[1]}`);
  console.log(`  Machines: ${counts[2]}`);
  console.log(`  Crew details: ${counts[3]}`);
  console.log(`  Materials: ${counts[4]}`);
  console.log(`  Outsourced: ${counts[5]}`);
  console.log(`  Additional work: ${counts[6]}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
