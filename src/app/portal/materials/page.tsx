import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Landscape Materials
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track materials inventory and usage
        </p>
      </div>
      <Card className="p-12 text-center">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Materials tracking coming soon.
        </p>
      </Card>
    </div>
  );
}
