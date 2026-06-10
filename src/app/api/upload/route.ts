import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";
import * as XLSX from "xlsx";
import { requireAuth } from "@/lib/api-auth";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";

export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth(["ADMIN", "MANAGER"]);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (![".zip", ".xlsx", ".xls", ".csv"].includes(ext)) {
      return NextResponse.json(
        { error: "Only .zip, .xlsx, .xls, and .csv files are accepted" },
        { status: 400 }
      );
    }

    // Enforce file size limit
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Ensure upload dir exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();

    const results: {
      fileName: string;
      sheets: { name: string; headers: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }[];
    }[] = [];

    if (ext === ".zip") {
      // Save the zip file
      const zipPath = path.join(UPLOAD_DIR, `${timestamp}_${file.name}`);
      await fs.writeFile(zipPath, buffer);

      // Extract and parse Excel files
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      const extractDir = path.join(UPLOAD_DIR, `${timestamp}_extracted`);
      await fs.mkdir(extractDir, { recursive: true });

      for (const entry of entries) {
        const name = entry.entryName;

        // Skip directories, hidden files, macOS resource forks
        if (
          entry.isDirectory ||
          name.startsWith("__MACOSX") ||
          name.startsWith(".")
        ) {
          continue;
        }

        const entryExt = path.extname(name).toLowerCase();
        if (![".xlsx", ".xls", ".csv"].includes(entryExt)) continue;

        const entryBuffer = entry.getData();

        // Zip slip protection: resolve and verify path stays within extractDir
        const safeName = path.basename(name);
        const targetPath = path.resolve(extractDir, safeName);
        if (!targetPath.startsWith(path.resolve(extractDir))) {
          console.warn(`Skipping zip entry with suspicious path: ${name}`);
          continue;
        }

        await fs.writeFile(targetPath, entryBuffer);

        // Parse with xlsx
        const workbook = XLSX.read(entryBuffer, { type: "buffer" });
        const sheets = workbook.SheetNames.map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
          const headers = json.length > 0 ? Object.keys(json[0]) : [];
          const sampleRows = json.slice(0, 5);
          return {
            name: sheetName,
            headers,
            rowCount: json.length,
            sampleRows,
          };
        });

        results.push({ fileName: path.basename(name), sheets });
      }
    } else {
      // Direct file upload (xlsx, xls, csv)
      const filePath = path.join(UPLOAD_DIR, `${timestamp}_${file.name}`);
      await fs.writeFile(filePath, buffer);

      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheets = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        const headers = json.length > 0 ? Object.keys(json[0]) : [];
        const sampleRows = json.slice(0, 5);
        return {
          name: sheetName,
          headers,
          rowCount: json.length,
          sampleRows,
        };
      });

      results.push({ fileName: file.name, sheets });
    }

    return NextResponse.json({
      message: "Upload successful",
      uploadedFile: file.name,
      filesFound: results.length,
      files: results,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
