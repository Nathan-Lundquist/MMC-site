import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { UserCog } from "lucide-react";
import { EmployeeRateCell } from "@/components/portal/EmployeeRateCell";

export default async function EmployeesPage() {
  const [session, employees] = await Promise.all([
    auth(),
    prisma.employee.findMany({
      orderBy: { name: "asc" },
      where: { active: true },
    }),
  ]);
  const editable = session?.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Employees
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {employees.length} active employees
        </p>
      </div>

      {employees.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCog className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No employees yet. Create an admin account to get started.
          </p>
        </Card>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                      {e.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <EmployeeRateCell
                      employeeId={e.id}
                      initialRate={e.hourlyRate ? Number(e.hourlyRate) : null}
                      editable={editable}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
