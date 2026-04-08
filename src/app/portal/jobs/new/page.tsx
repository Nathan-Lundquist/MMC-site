import { prisma } from "@/lib/db";
import { WorkOrderForm } from "@/components/portal/WorkOrderForm";

export default async function NewWorkOrderPage() {
  const [customers, employees] = await Promise.all([
    prisma.customer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          New Job
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new landscaping job
        </p>
      </div>
      <WorkOrderForm
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
      />
    </div>
  );
}
