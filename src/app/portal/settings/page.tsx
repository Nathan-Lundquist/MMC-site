import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Portal configuration and preferences
        </p>
      </div>
      <Card className="p-12 text-center">
        <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Settings coming soon.
        </p>
      </Card>
    </div>
  );
}
