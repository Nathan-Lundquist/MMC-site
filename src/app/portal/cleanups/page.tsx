import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CleanUpsWorkOrderList } from "@/components/portal/landscape-form";
import { CLEAN_UP_CATEGORY_VALUES } from "@/lib/job-categories";

export default async function CleanUpsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [workOrders, customers] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        status: { in: ["DRAFT", "IN_PROGRESS"] },
        jobCategory: { in: [...CLEAN_UP_CATEGORY_VALUES] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        workOrderNumber: true,
        jobType: true,
        jobCategory: true,
        status: true,
        notes: true,
        projectStartDate: true,
        customer: { select: { name: true } },
        _count: { select: { crewWorkLogs: true } },
      },
    }),
    prisma.customer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-lg mx-auto pb-24 sm:pb-6">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">
        Clean Ups
      </h1>
      <CleanUpsWorkOrderList
        workOrders={workOrders.map((wo) => ({
          id: wo.id,
          workOrderNumber: wo.workOrderNumber,
          jobType: wo.jobType,
          status: wo.status,
          customerName: wo.customer.name,
          startDate: wo.projectStartDate?.toISOString() || null,
          logCount: wo._count.crewWorkLogs,
        }))}
        customers={customers}
      />
    </div>
  );
}
