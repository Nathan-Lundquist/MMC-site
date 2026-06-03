export interface TimeRow {
  date: string;
  startTime: string;
  endTime: string;
}
export interface PaymentRow {
  date: string;
  checkNumber: string;
  amount: string;
}
export interface MachineRow {
  vehicleInfo: string;
  hours: string;
}
export interface CrewRow {
  date: string;
  employeeIds: string[];
  jobHours: string;
  setupHours: string;
  travelHours: string;
  unloadHours: string;
  deliveryHours: string;
}
export interface DebrisRow {
  date: string;
  amountYards: string;
  type: string;
}
export interface WeedingRow {
  date: string;
  numEmployees: string;
  timeValue: string;
  timeUnit: "HOURS" | "MINUTES";
}
export interface HourlyRow {
  date: string;
  typeOfWork: string;
  numEmployees: string;
  timeValue: string;
  timeUnit: "HOURS" | "MINUTES";
}
export interface MaterialRow {
  material: string;
  qty: string;
  units: string;
}
export interface OutsourcedRow {
  supplier: string;
  material: string;
  qty: string;
  unit: string;
  cost: string;
  perUnitCost: string;
  taxIncluded: boolean;
}
export interface AddlWorkRow {
  number: string;
  date: string;
  status: string;
  typeOfWork: string;
}
export interface AddlCrewRow {
  number: string;
  date: string;
  employeeId: string;
  jobHours: string;
  deliveryHours: string;
}
export interface AddlMaterialRow {
  material: string;
  qty: string;
  units: string;
}
export interface AddlOutsourcedRow {
  supplier: string;
  material: string;
  qty: string;
  units: string;
  cost: string;
  perUnitCost: string;
}

export interface WorkOrderInitialData {
  id: string;
  customerId: string;
  jobType: string;
  foremanId: string | null;
  woNumber: string;
  pctComplete: string;
  totalHours: string;
  notes: string;
  materialsNotUsed: string;
  timeRows: TimeRow[];
  paymentRows: PaymentRow[];
  machineRows: MachineRow[];
  crewRows: CrewRow[];
  debrisRows: DebrisRow[];
  weedingRows: WeedingRow[];
  hourlyRows: HourlyRow[];
  materialRows: MaterialRow[];
  outsourcedRows: OutsourcedRow[];
  addlWorkRows: AddlWorkRow[];
  addlCrewRows: AddlCrewRow[];
  addlMaterialRows: AddlMaterialRow[];
  addlOutsourcedRows: AddlOutsourcedRow[];
}

export interface FormProps {
  customers: { id: string; name: string }[];
  employees: { id: string; name: string }[];
  initialData?: WorkOrderInitialData;
}
