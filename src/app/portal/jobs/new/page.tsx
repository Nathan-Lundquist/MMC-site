import { prisma } from "@/lib/db";
import { WorkOrderForm } from "@/components/portal/work-order-form";

export default async function NewWorkOrderPage() {
  const [customers, employees, materialCatalog] = await Promise.all([
    prisma.customer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.landscapeMaterial.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
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
        materialCatalog={materialCatalog.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          kind: m.kind,
          defaultPrice: m.defaultPrice ? Number(m.defaultPrice) : null,
        }))}
      />
    </div>
  );
}
