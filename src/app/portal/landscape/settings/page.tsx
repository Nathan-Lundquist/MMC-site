import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MaterialSettings } from "@/components/portal/landscape-form";

export default async function LandscapeSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/portal");
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">
        Landscape Settings
      </h1>
      <MaterialSettings />
    </div>
  );
}
