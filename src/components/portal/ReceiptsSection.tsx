"use client";

import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Receipt as ReceiptIcon, Camera, Trash2, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate, formatStatus } from "@/lib/format";
import { RECEIPT_TYPES, RECEIPT_TYPE_COLORS, RECEIPT_DELETE_ROLES } from "@/lib/constants";

type ReceiptItem = {
  id: string;
  url: string;
  type: string;
  amount: number;
  uploadedBy: string;
  createdAt: string;
};

export default function ReceiptsSection({
  workOrderId,
  initialReceipts,
  userRole,
}: {
  workOrderId: string;
  initialReceipts: ReceiptItem[];
  userRole: string;
}) {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState(RECEIPT_TYPES[0].value);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDelete = (RECEIPT_DELETE_ROLES as readonly string[]).includes(userRole);
  const total = receipts.reduce((sum, r) => sum + r.amount, 0);
  const isValid = Boolean(file) && Boolean(amount) && Number(amount) > 0;

  const resetForm = useCallback(() => {
    setFile(null);
    setType(RECEIPT_TYPES[0].value);
    setAmount("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid || !file) return;
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("amount", amount);

      const res = await fetch(`/api/jobs/${workOrderId}/receipts`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload receipt");
        return;
      }
      setReceipts((r) => [data, ...r]);
      resetForm();
      setOpen(false);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [file, type, amount, isValid, workOrderId, resetForm]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Delete this receipt?")) return;
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setReceipts((r) => r.filter((item) => item.id !== id));
    } catch {
      // leave the card in place on network failure
    }
  }, []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Receipts ({receipts.length})
        </h3>
        <div className="flex items-center gap-3">
          {receipts.length > 0 && (
            <span className="text-sm font-medium text-foreground">
              Total: {formatCurrency(total)}
            </span>
          )}
          <Button
            size="sm"
            variant="outline-brand"
            className="gap-2"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Camera className="w-4 h-4" />
            Add Receipt
          </Button>
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
          <ReceiptIcon className="w-4 h-4" />
          No receipts yet
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-border"
            >
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.url}
                  alt="Receipt"
                  className="w-12 h-12 rounded-md object-cover bg-secondary"
                />
              </a>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      RECEIPT_TYPE_COLORS[r.type] || RECEIPT_TYPE_COLORS.OTHER
                    }`}
                  >
                    {formatStatus(r.type)}
                  </span>
                  <span className="font-medium text-sm">{formatCurrency(r.amount)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {r.uploadedBy} &middot; {formatDate(r.createdAt)}
                </div>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add Receipt</SheetTitle>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Photo</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/heic"
                capture="environment"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading || !isValid}
              className="w-full"
            >
              {loading ? "Uploading…" : "Submit"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
