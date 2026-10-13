import type { WorkOrder, Customer, Employee } from "@prisma/client";

type BoardJob = WorkOrder & {
  customer: Pick<Customer, "name">;
  foreman: Pick<Employee, "id" | "name"> | null;
};

/**
 * Serialize a WorkOrder for the board — selects only safe fields from the nested
 * customer/foreman relations. Employee carries passwordHash; never spread the full relation.
 */
export function toBoardJobDTO(job: BoardJob) {
  return {
    id: job.id,
    workOrderNumber: job.workOrderNumber,
    jobType: job.jobType,
    status: job.status,
    customerName: job.customer.name,
    foreman: job.foreman ? { id: job.foreman.id, name: job.foreman.name } : null,
    projectStartDate: job.projectStartDate ? job.projectStartDate.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
  };
}
