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
