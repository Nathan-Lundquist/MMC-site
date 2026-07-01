import { z } from "zod";

const timeEntrySchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
});

const paymentSchema = z.object({
  date: z.string(),
  checkNumber: z.string(),
  amount: z.string(),
});

const machineSchema = z.object({
  vehicleInfo: z.string(),
  hours: z.string(),
});

const crewDetailSchema = z.object({
  date: z.string(),
  employeeId: z.string(),
  jobHours: z.string(),
  setupHours: z.string(),
  travelHours: z.string(),
  unloadHours: z.string(),
  deliveryHours: z.string(),
});

const debrisSchema = z.object({
  date: z.string(),
  amountYards: z.string(),
  type: z.string(),
});

const weedingSchema = z.object({
  date: z.string(),
  numEmployees: z.string(),
  timeValue: z.string(),
  timeUnit: z.enum(["HOURS", "MINUTES"]),
});

const hourlyWorkSchema = z.object({
  date: z.string(),
  typeOfWork: z.string(),
  numEmployees: z.string(),
  timeValue: z.string(),
  timeUnit: z.enum(["HOURS", "MINUTES"]),
});

const materialSchema = z.object({
  material: z.string(),
  qty: z.string(),
  units: z.string(),
});

const outsourcedMaterialSchema = z.object({
  supplier: z.string(),
  material: z.string(),
  qty: z.string(),
  unit: z.string(),
  cost: z.string(),
  perUnitCost: z.string(),
  taxIncluded: z.boolean().optional(),
});

const additionalWorkSchema = z.object({
  number: z.string(),
  date: z.string(),
  status: z.string(),
  typeOfWork: z.string(),
});

const additionalCrewSchema = z.object({
  number: z.string(),
  date: z.string(),
  employeeId: z.string(),
  jobHours: z.string(),
  deliveryHours: z.string(),
});

const additionalMaterialSchema = z.object({
  material: z.string(),
  qty: z.string(),
  units: z.string(),
});

const additionalOutsourcedSchema = z.object({
  supplier: z.string(),
  material: z.string(),
  qty: z.string(),
  units: z.string(),
  cost: z.string(),
  perUnitCost: z.string(),
});

export const workOrderBodySchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  jobType: z.string().optional().default(""),
  foremanId: z.string().optional().default(""),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  woNumber: z.string().min(1, "Work Order Number is required"),
  pctComplete: z.number().min(0).max(100).optional().default(0),
  totalHours: z.number().min(0).optional().default(0),
  notes: z.string().optional().default(""),
  materialsNotUsed: z.string().optional().default(""),
  timeEntries: z.array(timeEntrySchema).optional().default([]),
  payments: z.array(paymentSchema).optional().default([]),
  machines: z.array(machineSchema).optional().default([]),
  crewDetails: z.array(crewDetailSchema).optional().default([]),
  debris: z.array(debrisSchema).optional().default([]),
  weeding: z.array(weedingSchema).optional().default([]),
  hourlyWork: z.array(hourlyWorkSchema).optional().default([]),
  materials: z.array(materialSchema).optional().default([]),
  outsourcedMaterials: z.array(outsourcedMaterialSchema).optional().default([]),
  additionalWork: z.array(additionalWorkSchema).optional().default([]),
  additionalCrewDetails: z.array(additionalCrewSchema).optional().default([]),
  additionalMaterials: z.array(additionalMaterialSchema).optional().default([]),
  additionalOutsourced: z.array(additionalOutsourcedSchema).optional().default([]),
});

export type WorkOrderBody = z.infer<typeof workOrderBodySchema>;

// --- Snow schemas ---

export const snowSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(200),
});

export const snowSiteUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  active: z.boolean().optional(),
});

export const snowRateSchema = z.object({
  bulkSaltPerYard: z.number().min(0),
  iceMelterPerBag: z.number().min(0),
  calciumPerBag: z.number().min(0),
  employeePerHour: z.number().min(0),
  fuelPerHour: z.number().min(0),
  indirectMultiplier: z.number().min(0),
});

export const snowSiteServiceSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  servicesPerformed: z.string().optional().default(""),
  plowCount: z.number().int().min(0).optional().default(0),
  saltLotCount: z.number().int().min(0).optional().default(0),
  shovelCount: z.number().int().min(0).optional().default(0),
  saltWalkCount: z.number().int().min(0).optional().default(0),
  bulkSaltYards: z.number().min(0).optional().default(0),
  iceMelterBags: z.number().min(0).optional().default(0),
  calciumChlorideBags: z.number().min(0).optional().default(0),
  crewMembers: z.array(z.string()).min(1, "At least one crew member required"),
  additionalWorkRequested: z.boolean().optional().default(false),
  additionalWorkDesc: z.string().optional().default(""),
  siteNotes: z.string().optional().default(""),
});

export const snowStormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  eventStart: z.string().min(1, "Event start is required"),
  eventEnd: z.string().min(1, "Event end is required"),
});

// --- Landscape crew form schemas ---

export const crewWorkLogSchema = z.object({
  workOrderId: z.string().min(1, "Work order is required"),
  workType: z.string().min(1, "Work type is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  crewMembers: z.array(z.string()).min(1, "At least one crew member required"),
  materials: z
    .array(
      z.object({
        materialId: z.string().min(1),
        quantity: z.number().min(0),
      })
    )
    .optional()
    .default([]),
  notes: z.string().optional().default(""),
});

export const landscapeMaterialSchema = z.object({
  name: z.string().min(1, "Material name is required").max(200),
  unit: z.string().max(50).optional().default(""),
});

export const landscapeMaterialUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.string().max(50).optional(),
  active: z.boolean().optional(),
});
