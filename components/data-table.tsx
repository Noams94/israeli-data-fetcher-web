"use client";

import { useMemo, useState } from "react";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";

interface Props {
  rows: Record<string, unknown>[];
  caption?: string;
  maxRows?: number;
}

function isInternal(col: string): boolean {
  return col === "_full_text" || col === "rank";
}

export function DataTable({ rows, caption, maxRows = 100 }: Props) {
  const lang = useUi((s) => s.lang);
  const [q, setQ] = useState("");

  const columns = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const r of rows) {
      for (const k of Object.keys(r)) {
        if (!isInternal(k) && !seen.has(k)) {
          seen.add(k);
          ordered.push(k);
        }
      }
    }
    return ordered;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c] ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, columns, q]);

  const shown = filtered.slice(0, maxRows);

  return (
    <div className="flex flex-col gap-2">
      {caption && <div className="text-xs text-muted">{caption}</div>}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search_in_table", lang)}
        className="idf-select"
        aria-label={t("search_in_table", lang)}
      />
      <div className="idf-table-wrap max-h-[520px] overflow-auto">
        <table className="idf-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                {columns.map((c) => {
                  const v = r[c];
                  return (
                    <td key={c}>
                      {v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-muted">
                  {t("no_results", lang)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > maxRows && (
        <div className="text-xs text-muted">
          {`${maxRows} / ${filtered.length} ${t("rows", lang)}`}
        </div>
      )}
    </div>
  );
}
