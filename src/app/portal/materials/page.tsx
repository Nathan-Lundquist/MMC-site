import { auth } from "@/lib/auth";
import { MaterialSettings } from "@/components/portal/landscape-form";
import { MANAGER_VISIBLE_ROLES } from "@/lib/constants";

export default async function MaterialsPage() {
  const session = await auth();
  const editable = MANAGER_VISIBLE_ROLES.includes(
    (session?.user.role ?? "") as (typeof MANAGER_VISIBLE_ROLES)[number]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Materials
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Catalog of in-house and outsourced materials, with default prices
        </p>
      </div>
      <MaterialSettings editable={editable} />
    </div>
  );
}
