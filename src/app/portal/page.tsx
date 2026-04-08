import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { ClipboardList, Users, UserCog, Clock } from "lucide-react";
import Link from "next/link";

export default async function PortalDashboard() {
  const [woCount, customerCount, employeeCount, recentOrders] =
    await Promise.all([
      prisma.workOrder.count(),
      prisma.customer.count(),
      prisma.employee.count({ where: { active: true } }),
      prisma.workOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, foreman: true },
      }),
    ]);

  const stats = [
    {
      label: "Jobs",
      value: woCount,
      icon: ClipboardList,
      href: "/portal/jobs",
    },
    {
      label: "Customers",
      value: customerCount,
      icon: Users,
      href: "/portal/customers",
    },
    {
      label: "Employees",
      value: employeeCount,
      icon: UserCog,
      href: "/portal/employees",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of operations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 hover:border-brand/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent work orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-foreground">
            Recent Jobs
          </h2>
          <Link
            href="/portal/jobs"
            className="text-xs text-brand hover:underline"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No jobs yet. Create your first one to get started.
            </p>
            <Link
              href="/portal/jobs/new"
              className="inline-flex mt-3 text-sm font-medium text-brand hover:underline"
            >
              Create Job
            </Link>
          </Card>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">
                    WO #
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                    Type
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground text-right">
                    Complete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/portal/jobs/${wo.id}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {wo.workOrderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{wo.customer.name}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground">
                      {wo.jobType}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {wo.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {Number(wo.percentCompleted)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
