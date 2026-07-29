import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SnowSettings } from "@/components/portal/snow-form/SnowSettings";

export default async function SnowSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect("/portal/snow");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">
        Snow Settings
      </h1>
      <SnowSettings />
    </div>
  );
}
