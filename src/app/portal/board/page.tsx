import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getBoardJobs } from "@/lib/board";
import JobBoard from "@/components/portal/board/JobBoard";

export default async function BoardPage() {
  const [session, jobs, customers, foremen] = await Promise.all([
    auth(),
    getBoardJobs(),
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
      initialJobs={jobs}
      userRole={session!.user.role}
      customers={customers}
      foremen={foremen}
    />
  );
}
