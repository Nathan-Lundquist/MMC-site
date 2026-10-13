import type { WorkOrderStatus } from "@prisma/client";

export type BoardJob = {
  id: string;
  workOrderNumber: string;
  jobType: string;
  // Typed as the full enum (what toBoardJobDTO actually returns); in practice the board
  // API/page queries only ever return DRAFT/IN_PROGRESS/recent-COMPLETED jobs.
  status: WorkOrderStatus;
  customerName: string;
  foreman: { id: string; name: string } | null;
  projectStartDate: string | null;
  createdAt: string;
};
