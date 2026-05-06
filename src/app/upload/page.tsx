"use client";

import { useState, useCallback } from "react";

interface SheetInfo {
  name: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, unknown>[];
}

interface FileResult {
  fileName: string;
  sheets: SheetInfo[];
}

interface UploadResponse {
  message: string;
  zipFile: string;
  filesFound: number;
  files: FileResult[];
  error?: string;
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Endpoint Data Upload</h1>
        <p className="text-zinc-400 mb-8">
          Upload a .zip file containing Excel spreadsheets. The files will be
          extracted, parsed, and the structure displayed below.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer ${
            dragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-zinc-700 hover:border-zinc-500"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".zip"
            onChange={onFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="space-y-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-zinc-400">Uploading and parsing...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="w-12 h-12 mx-auto text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
              </svg>
              <p className="text-lg text-zinc-300">
                Drop your .zip file here or click to browse
              </p>
              <p className="text-sm text-zinc-500">
                Accepts .zip files containing .xlsx, .xls, or .csv files
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
              {result.message} — found {result.filesFound} spreadsheet(s) in{" "}
              <span className="font-mono">{result.zipFile}</span>
            </div>

            {result.files.map((file, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <h2 className="text-lg font-semibold font-mono">
                    {file.fileName}
                  </h2>
                </div>

                {file.sheets.map((sheet, j) => (
                  <div key={j} className="p-6 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm font-medium text-zinc-300">
                        Sheet: {sheet.name}
                      </span>
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {sheet.rowCount} rows
                      </span>
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {sheet.headers.length} columns
                      </span>
                    </div>

                    {/* Headers */}
                    <div className="mb-4">
                      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                        Columns
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {sheet.headers.map((h, k) => (
                          <span
                            key={k}
                            className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sample data table */}
                    {sheet.sampleRows.length > 0 && (
                      <div>
                        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                          Sample Data (first 5 rows)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-zinc-800">
                                {sheet.headers.map((h, k) => (
                                  <th
                                    key={k}
                                    className="text-left p-2 text-zinc-400 font-medium whitespace-nowrap"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sheet.sampleRows.map((row, ri) => (
                                <tr
                                  key={ri}
                                  className="border-b border-zinc-800/30"
                                >
                                  {sheet.headers.map((h, ci) => (
                                    <td
                                      key={ci}
                                      className="p-2 text-zinc-300 whitespace-nowrap max-w-[200px] truncate"
                                    >
                                      {String(row[h] ?? "")}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
