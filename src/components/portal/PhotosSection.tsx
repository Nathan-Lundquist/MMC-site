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
import { Camera, Trash2, AlertCircle, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import { PHOTO_DELETE_ROLES } from "@/lib/constants";

type PhotoItem = {
  id: string;
  url: string;
  type: "BEFORE" | "AFTER";
  uploadedAt: string;
};

function PhotoGroup({
  label,
  type,
  photos,
  canDelete,
  onDelete,
  onAddClick,
}: {
  label: string;
  type: "BEFORE" | "AFTER";
  photos: PhotoItem[];
  canDelete: boolean;
  onDelete: (id: string) => void;
  onAddClick: (type: "BEFORE" | "AFTER") => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label} ({photos.length})
        </h4>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={() => onAddClick(type)}>
          <Camera className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
      {photos.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-6 border border-dashed border-border rounded-lg">
          <ImageIcon className="w-4 h-4" />
          No {label.toLowerCase()} photos
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group">
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${label} photo`}
                  className="w-full aspect-square rounded-md object-cover bg-secondary"
                />
              </a>
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-b-md truncate">
                {formatDate(p.uploadedAt)}
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete photo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhotosSection({
  workOrderId,
  initialPhotos,
  userRole,
}: {
  workOrderId: string;
  initialPhotos: PhotoItem[];
  userRole: string;
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [open, setOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"BEFORE" | "AFTER">("BEFORE");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canDelete = (PHOTO_DELETE_ROLES as readonly string[]).includes(userRole);
  const beforePhotos = photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = photos.filter((p) => p.type === "AFTER");

  const openSheet = useCallback((type: "BEFORE" | "AFTER") => {
    setUploadType(type);
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (loading || !file) return;
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);

      const res = await fetch(`/api/jobs/${workOrderId}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload photo");
        return;
      }
      setPhotos((p) => [...p, data]);
      setOpen(false);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [loading, file, uploadType, workOrderId]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Delete this photo?")) return;
    setDeleteError("");
    try {
      const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || "Failed to delete photo");
        return;
      }
      setPhotos((p) => p.filter((item) => item.id !== id));
    } catch {
      setDeleteError("Network error");
    }
  }, []);

  return (
    <Card className="p-4">
      <h3 className="font-display text-sm font-semibold text-foreground mb-3">
        Photos
      </h3>

      {deleteError && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-2">
          <AlertCircle size={14} /> {deleteError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <PhotoGroup
          label="Before"
          type="BEFORE"
          photos={beforePhotos}
          canDelete={canDelete}
          onDelete={handleDelete}
          onAddClick={openSheet}
        />
        <PhotoGroup
          label="After"
          type="AFTER"
          photos={afterPhotos}
          canDelete={canDelete}
          onDelete={handleDelete}
          onAddClick={openSheet}
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add {uploadType === "BEFORE" ? "Before" : "After"} Photo</SheetTitle>
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
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
          <SheetFooter>
            <Button onClick={handleSubmit} disabled={loading || !file} className="w-full">
              {loading ? "Uploading…" : "Submit"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
