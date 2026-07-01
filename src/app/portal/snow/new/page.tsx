import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StormForm } from "@/components/portal/snow-form/StormForm";

export default async function NewStormPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    redirect("/portal/snow");
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">
        Create Storm Event
      </h1>
      <StormForm />
    </div>
  );
}
