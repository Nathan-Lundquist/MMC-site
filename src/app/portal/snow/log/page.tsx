import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SiteVisitForm } from "@/components/portal/snow-form/SiteVisitForm";

export default async function SnowLogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [sites, employees] = await Promise.all([
    prisma.snowSite.findMany({
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
        Log Site Visit
      </h1>
      <SiteVisitForm
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
        employees={employees}
        currentUser={session.user.name || ""}
      />
    </div>
  );
}
