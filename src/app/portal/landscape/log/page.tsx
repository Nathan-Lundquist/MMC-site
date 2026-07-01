import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CrewWorkLogForm } from "@/components/portal/landscape-form";

export default async function LandscapeLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [workOrders, materials, employees] = await Promise.all([
    prisma.workOrder.findMany({
      where: { status: { in: ["DRAFT", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        workOrderNumber: true,
        jobType: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.landscapeMaterial.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-lg mx-auto pb-24 sm:pb-6">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">
        Log Work
      </h1>
      <CrewWorkLogForm
        workOrders={workOrders.map((wo) => ({
          id: wo.id,
          workOrderNumber: wo.workOrderNumber,
          jobType: wo.jobType,
          customerName: wo.customer.name,
        }))}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
        }))}
        employees={employees}
        currentUser={session.user.name || ""}
      />
    </div>
  );
}
