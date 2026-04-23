"use client";

import { useState } from "react";
import { CkanError, datastoreSearchSql } from "@/lib/ckan";
import { t, isRtl } from "@/lib/i18n";
import { useUi } from "@/lib/store";
import { friendlyError } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export-buttons";
import { ErrorBanner, Loading } from "@/components/loading";

const EXAMPLES = [
  `-- כל השורות בטבלה (החלף את resource_id)
SELECT * FROM "<resource_id>" LIMIT 100;`,
  `-- סינון לפי עיר
SELECT * FROM "<resource_id>" WHERE "עיר" = 'תל אביב' LIMIT 100;`,
  `-- ספירה לפי קטגוריה
SELECT "קטגוריה", COUNT(*) FROM "<resource_id>" GROUP BY "קטגוריה";`,
];

export default function SqlPage() {
  const lang = useUi((s) => s.lang);
  const [sql, setSql] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!sql.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const out = await datastoreSearchSql(sql);
      setRows(out.records ?? []);
    } catch (e) {
      const kind = e instanceof CkanError ? e.kind : "unknown";
      setErr(friendlyError(kind, (k) => t(k, lang)));
      setRows(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t("advanced_sql", lang)}</h1>
      </header>

      <details className="rounded-lg border border-card-border bg-bg-alt">
        <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
          {t("sql_examples", lang)}
        </summary>
        <div className="border-t border-card-border p-4">
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex, i) => (
              <pre
                key={i}
                onClick={() => setSql(ex)}
                className="cursor-pointer whitespace-pre-wrap rounded-md border border-card-border bg-card p-3 font-mono text-xs hover:border-primary"
                title="Click to use"
              >
                {ex}
              </pre>
            ))}
          </div>
        </div>
      </details>

      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        placeholder={t("sql_placeholder", lang)}
        className="idf-textarea min-h-[200px]"
        dir="ltr"
      />

      <div>
        <button onClick={run} disabled={!sql.trim() || busy} className="idf-btn-primary">
          {busy ? t("loading", lang) : t("run_sql", lang)}
        </button>
      </div>

      {err && <ErrorBanner message={err} />}
      {busy && <Loading />}

      {rows && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-muted">
            {t("total_rows", lang)}: {rows.length.toLocaleString()}
          </div>
          <DataTable rows={rows} />
          <ExportButtons rows={rows} baseName="sql_result" rtl={isRtl(lang)} />
        </div>
      )}
      {rows && rows.length === 0 && (
        <div className="text-sm text-muted">{t("no_results", lang)}</div>
      )}
    </div>
  );
}
