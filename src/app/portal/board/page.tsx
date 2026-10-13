import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toBoardJobDTO } from "@/lib/board";
import { BOARD_DONE_WINDOW_DAYS } from "@/lib/constants";
import JobBoard from "@/components/portal/board/JobBoard";

export default async function BoardPage() {
  const doneWindowStart = new Date(
    Date.now() - BOARD_DONE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const [session, jobs, customers, foremen] = await Promise.all([
    auth(),
    prisma.workOrder.findMany({
      where: {
        OR: [
          { status: { in: ["DRAFT", "IN_PROGRESS"] } },
          {
            status: "COMPLETED",
            boardStatusChangedAt: { gte: doneWindowStart },
          },
        ],
      },
      include: {
        customer: { select: { name: true } },
        foreman: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <JobBoard
      initialJobs={jobs.map(toBoardJobDTO)}
      userRole={session!.user.role}
      customers={customers}
      foremen={foremen}
    />
  );
}
