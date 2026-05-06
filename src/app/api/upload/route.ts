import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import AdmZip from "adm-zip";
import * as XLSX from "xlsx";

export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Only .zip files are accepted" },
        { status: 400 }
      );
    }

    // Ensure upload dir exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Save the zip file
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const zipPath = path.join(UPLOAD_DIR, `${timestamp}_${file.name}`);
    await fs.writeFile(zipPath, buffer);

    // Extract and parse Excel files
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const results: {
      fileName: string;
      sheets: { name: string; headers: string[]; rowCount: number; sampleRows: Record<string, unknown>[] }[];
    }[] = [];

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

      const ext = path.extname(name).toLowerCase();
      if (![".xlsx", ".xls", ".csv"].includes(ext)) continue;

      const entryBuffer = entry.getData();

      // Save extracted file
      const extractDir = path.join(UPLOAD_DIR, `${timestamp}_extracted`);
      await fs.mkdir(extractDir, { recursive: true });
      const safeName = path.basename(name);
      await fs.writeFile(path.join(extractDir, safeName), entryBuffer);

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

    return NextResponse.json({
      message: "Upload successful",
      zipFile: file.name,
      filesFound: results.length,
      files: results,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: String(err) },
      { status: 500 }
    );
  }
}
