"use client";

import { Card } from "@/components/ui/card";
import type { PaymentRow } from "./types";
import { todayLocal, updateRow, removeRow } from "./helpers";
import {
  MobileInput,
  Field,
  SectionHeader,
  TodayBtn,
  RowDelete,
  EmptyState,
  GroupHeading,
  DenseTable,
  TableInput,
  TableRowDelete,
  TableAddRow,
} from "./form-ui";

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

        <div className="sm:hidden space-y-3">
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
        </div>

        <div>
          <DenseTable columns={["Date", "Check Number", "Amount"]}>
            {paymentRows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-b-0 even:bg-secondary/20">
                <td className="p-0.5 w-36">
                  <TableInput type="date" value={row.date} onChange={(e) => updateRow(setPaymentRows, i, "date", e.target.value)} />
                </td>
                <td className="p-0.5 w-32">
                  <TableInput value={row.checkNumber} onChange={(e) => updateRow(setPaymentRows, i, "checkNumber", e.target.value)} />
                </td>
                <td className="p-0.5 w-28">
                  <TableInput type="number" step="0.01" value={row.amount} onChange={(e) => updateRow(setPaymentRows, i, "amount", e.target.value)} />
                </td>
                <td className="p-0.5 text-center">
                  <TableRowDelete onClick={() => removeRow(setPaymentRows, i)} />
                </td>
              </tr>
            ))}
            {paymentRows.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-sm text-muted-foreground">
                  No payments recorded.
                </td>
              </tr>
            )}
          </DenseTable>
          <TableAddRow label="Add Payment" onClick={() => setPaymentRows((p) => [...p, { date: todayLocal(), checkNumber: "", amount: "" }])} />
        </div>
      </Card>

      <p className="text-xs text-muted-foreground px-1">
        Before/After photos can be added once the job is saved, from the job detail page.
      </p>
    </>
  );
}
