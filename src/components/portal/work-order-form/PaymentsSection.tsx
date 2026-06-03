"use client";

import { Card } from "@/components/ui/card";
import type { PaymentRow } from "./types";
import { todayLocal, updateRow, removeRow } from "./helpers";
import { MobileInput, Field, SectionHeader, TodayBtn, RowDelete, EmptyState, GroupHeading } from "./form-ui";

interface Props {
  paymentRows: PaymentRow[];
  setPaymentRows: React.Dispatch<React.SetStateAction<PaymentRow[]>>;
}

export function PaymentsSection({ paymentRows, setPaymentRows }: Props) {
  return (
    <>
      <GroupHeading>Payments &amp; Photos</GroupHeading>

      <Card className="p-4 space-y-3">
        <SectionHeader title="Payment or Deposit" count={paymentRows.length} onAdd={() =>
          setPaymentRows((p) => [...p, { date: todayLocal(), checkNumber: "", amount: "" }])
        } />
        {paymentRows.length === 0 && <EmptyState text="No payments recorded." />}
        {paymentRows.map((row, i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-end">
              <RowDelete onClick={() => removeRow(setPaymentRows, i)} />
            </div>
            <Field label="Date" action={<TodayBtn onClick={() => updateRow(setPaymentRows, i, "date", todayLocal())} />}>
              <MobileInput type="date" value={row.date} onChange={(e) => updateRow(setPaymentRows, i, "date", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check Number">
                <MobileInput value={row.checkNumber} onChange={(e) => updateRow(setPaymentRows, i, "checkNumber", e.target.value)} />
              </Field>
              <Field label="Amount">
                <MobileInput type="number" step="0.01" value={row.amount} onChange={(e) => updateRow(setPaymentRows, i, "amount", e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Photos</h3>
        <Field label="Before Pictures">
          <MobileInput type="file" accept="image/*" multiple />
        </Field>
        <Field label="After Pictures">
          <MobileInput type="file" accept="image/*" multiple />
        </Field>
        <p className="text-xs text-muted-foreground">Upload happens on save.</p>
      </Card>
    </>
  );
}
