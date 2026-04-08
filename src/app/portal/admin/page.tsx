import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Current Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active season administration and configuration
        </p>
      </div>
      <Card className="p-12 text-center">
        <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Admin panel coming soon.
        </p>
      </Card>
    </div>
  );
}
