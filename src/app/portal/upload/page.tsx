"use client";

import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

interface SheetResult {
  name: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, unknown>[];
}

interface FileResult {
  fileName: string;
  sheets: SheetResult[];
}

interface UploadResponse {
  message: string;
  uploadedFile: string;
  filesFound: number;
  files: FileResult[];
}

const ACCEPTED_TYPES = ".xlsx,.xls,.csv,.zip";

export default function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setResult(null);
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Upload Data
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload Excel or CSV files to preview and import data
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={`relative border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-brand bg-brand/5"
            : "border-border hover:border-brand/40"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">
          Drop a file here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Accepts .xlsx, .xls, .csv, or .zip containing spreadsheets
        </p>
      </Card>

      {/* Selected file */}
      {selectedFile && !result && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-brand shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload & Preview"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Card className="p-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {result.message}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {result.filesFound} file{result.filesFound !== 1 ? "s" : ""} found
                  in {result.uploadedFile}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={clearSelection}
              >
                Upload Another
              </Button>
            </div>
          </Card>

          {result.files.map((file, fi) => (
            <Card key={fi} className="overflow-hidden">
              <div className="px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-brand" />
                  <span className="text-sm font-medium text-foreground">
                    {file.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {file.sheets.length} sheet{file.sheets.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {file.sheets.map((sheet, si) => (
                <div key={si} className={si > 0 ? "border-t border-border" : ""}>
                  <div className="px-4 py-2 bg-secondary/20">
                    <span className="text-xs font-medium text-foreground">
                      {sheet.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {sheet.rowCount} rows, {sheet.headers.length} columns
                    </span>
                  </div>

                  {sheet.headers.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/30">
                            {sheet.headers.map((h) => (
                              <th
                                key={h}
                                className="px-3 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sheet.sampleRows.map((row, ri) => (
                            <tr key={ri} className="hover:bg-secondary/20">
                              {sheet.headers.map((h) => (
                                <td
                                  key={h}
                                  className="px-3 py-1.5 text-foreground whitespace-nowrap max-w-[200px] truncate"
                                >
                                  {String(row[h] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
