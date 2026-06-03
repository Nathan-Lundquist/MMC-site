"use client";

import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./form-ui";

interface Props {
  notes: string;
  setNotes: (v: string) => void;
  materialsNotUsed: string;
  setMaterialsNotUsed: (v: string) => void;
}

export function NotesSection({ notes, setNotes, materialsNotUsed, setMaterialsNotUsed }: Props) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-display text-sm font-semibold text-foreground">Notes</h3>
      <Field label="Additional Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="text-base sm:text-sm" />
      </Field>
      <Field label="Material/Services not used or performed">
        <Textarea value={materialsNotUsed} onChange={(e) => setMaterialsNotUsed(e.target.value)} rows={3} className="text-base sm:text-sm" />
      </Field>
    </Card>
  );
}
