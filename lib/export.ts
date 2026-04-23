import ExcelJS from "exceljs";

const BOM = "\uFEFF";

function cleanRecords(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const { _full_text, rank, ...rest } = r as Record<string, unknown> & {
      _full_text?: unknown;
      rank?: unknown;
    };
    void _full_text;
    void rank;
    return rest;
  });
}

function columns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        ordered.push(k);
      }
    }
  }
  return ordered;
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Record<string, unknown>[]): Blob {
  const clean = cleanRecords(rows);
  const cols = columns(clean);
  const header = cols.map(escapeCsv).join(",");
  const body = clean
    .map((r) => cols.map((c) => escapeCsv(r[c])).join(","))
    .join("\n");
  // UTF-8 BOM so Excel opens Hebrew correctly
  return new Blob([BOM + header + "\n" + body], { type: "text/csv;charset=utf-8" });
}

export function toJson(rows: Record<string, unknown>[]): Blob {
  const clean = cleanRecords(rows);
  return new Blob([JSON.stringify(clean, null, 2)], {
    type: "application/json;charset=utf-8",
  });
}

function sanitizeSheetName(name: string): string {
  return (name || "Sheet").replace(/[\[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Sheet";
}

export async function toXlsx(
  rows: Record<string, unknown>[],
  opts: { sheetName?: string; rtl?: boolean } = {},
): Promise<Blob> {
  const clean = cleanRecords(rows);
  const cols = columns(clean);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Israeli Data Fetcher";
  wb.created = new Date();

  const ws = wb.addWorksheet(sanitizeSheetName(opts.sheetName ?? "Data"), {
    views: [{ rightToLeft: opts.rtl !== false, state: "frozen", ySplit: 1 }],
  });

  ws.columns = cols.map((c) => ({
    header: c,
    key: c,
    width: Math.min(Math.max(c.length + 2, 12), 60),
  }));

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF10A37F" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  for (const r of clean) {
    const row: Record<string, unknown> = {};
    for (const c of cols) row[c] = r[c] ?? "";
    ws.addRow(row);
  }

  // Auto-fit a bit by measuring sample length
  for (let i = 0; i < cols.length; i++) {
    const col = ws.getColumn(i + 1);
    let maxLen = String(cols[i]).length;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const v = cell.value;
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      if (s.length > maxLen) maxLen = s.length;
    });
    col.width = Math.min(Math.max(maxLen + 2, 12), 60);
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
