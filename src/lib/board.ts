import type { WorkOrder, Customer, Employee } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BOARD_DONE_WINDOW_DAYS } from "@/lib/constants";
import type { BoardJob } from "@/components/portal/board/types";

type BoardEligibleJob = WorkOrder & {
  customer: Pick<Customer, "name">;
  foreman: Pick<Employee, "id" | "name"> | null;
};

/**
 * Serialize a WorkOrder for the board — selects only safe fields from the nested
 * customer/foreman relations. Employee carries passwordHash; never spread the full relation.
 */
export function toBoardJobDTO(job: BoardEligibleJob): BoardJob {
  return {
    id: job.id,
    workOrderNumber: job.workOrderNumber,
    jobType: job.jobType,
    status: job.status as BoardJob["status"],
    customerName: job.customer.name,
    foreman: job.foreman ? { id: job.foreman.id, name: job.foreman.name } : null,
    projectStartDate: job.projectStartDate ? job.projectStartDate.toISOString() : null,
    createdAt: job.createdAt.toISOString(),
  };
}

/**
 * Jobs eligible for the Kanban board: all DRAFT/IN_PROGRESS jobs, plus COMPLETED jobs whose
 * board status last changed within BOARD_DONE_WINDOW_DAYS (keeps the Done column from
 * resurrecting the ~1000 historical completed work orders imported from Zoho/Excel).
 */
export async function getBoardJobs(): Promise<BoardJob[]> {
  const doneWindowStart = new Date(Date.now() - BOARD_DONE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const jobs = await prisma.workOrder.findMany({
    where: {
      OR: [
        { status: { in: ["DRAFT", "IN_PROGRESS"] } },
        { status: "COMPLETED", boardStatusChangedAt: { gte: doneWindowStart } },
      ],
    },
    include: {
      customer: { select: { name: true } },
      foreman: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map(toBoardJobDTO);
}
