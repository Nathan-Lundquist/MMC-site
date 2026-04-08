import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    where: { active: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Customers
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {customers.length} active customers
        </p>
      </div>

      {customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No customers yet. They&apos;ll appear here as work orders are created.
          </p>
        </Card>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">City</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{c.phone || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{c.email || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{c.city || "—"}, {c.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
