"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { buildApiUrl, datastoreSearch, CkanError } from "@/lib/ckan";
import type { CkanResource } from "@/lib/types";
import { useUi } from "@/lib/store";
import { t, isRtl } from "@/lib/i18n";
import { friendlyError } from "@/lib/utils";
import { DataTable } from "./data-table";
import { ExportButtons } from "./export-buttons";
import { Loading, ErrorBanner } from "./loading";

const EXPORT_OPTIONS = [100, 500, 1000, 5000];

export function ResourcePreview({ resource }: { resource: CkanResource }) {
  const lang = useUi((s) => s.lang);
  const [exportLimit, setExportLimit] = useState(1000);

  const active = Boolean(resource.datastore_active);

  const preview = useQuery({
    queryKey: ["datastore", resource.id, "preview", 100],
    queryFn: ({ signal }) =>
      datastoreSearch({ resourceId: resource.id, limit: 100, signal }),
    enabled: active,
    staleTime: 5 * 60 * 1000,
  });

  const exportQuery = useQuery({
    queryKey: ["datastore", resource.id, "export", exportLimit],
    queryFn: ({ signal }) =>
      datastoreSearch({ resourceId: resource.id, limit: exportLimit, signal }),
    enabled: active && exportLimit > 100,
    staleTime: 5 * 60 * 1000,
  });

  if (!active) {
    return (
      <div className="rounded-lg border border-card-border bg-bg-alt p-4 text-sm">
        <p className="text-muted">{t("not_in_datastore", lang)}</p>
        {resource.url && (
          <a href={resource.url} target="_blank" rel="noreferrer" className="idf-link mt-2 inline-block">
            {resource.url}
          </a>
        )}
      </div>
    );
  }

  if (preview.isLoading) return <Loading />;
  if (preview.isError) {
    const kind = preview.error instanceof CkanError ? preview.error.kind : "unknown";
    return <ErrorBanner message={friendlyError(kind, (k) => t(k, lang))} />;
  }

  const data = preview.data!;
  const rows = data.records ?? [];
  const total = data.total ?? rows.length;

  const exportRows =
    exportLimit <= 100 ? rows : exportQuery.data?.records ?? rows;

  const apiUrl = buildApiUrl("datastore_search", {
    resource_id: resource.id,
    limit: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label={t("total_rows", lang)} value={total.toLocaleString()} />
        <Metric label={t("columns", lang)} value={String(data.fields?.length ?? 0)} />
        <Metric label={t("preview", lang)} value={`${rows.length}`} />
        <Metric label={t("export", lang)} value={`${Math.min(exportLimit, total).toLocaleString()}`} />
      </div>

      <DataTable rows={rows} />

      <div className="flex flex-col gap-3 rounded-lg border border-card-border bg-bg-alt p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">{t("export", lang)}:</span>
          <select
            value={exportLimit}
            onChange={(e) => setExportLimit(Number(e.target.value))}
            className="idf-select max-w-[140px]"
            aria-label={t("total_rows", lang)}
          >
            {EXPORT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString()} {t("rows", lang)}
              </option>
            ))}
          </select>
          {exportQuery.isFetching && <span className="text-xs text-muted">{t("loading", lang)}</span>}
        </div>
        <ExportButtons
          rows={exportRows}
          baseName={resource.name || "dataset"}
          apiUrl={apiUrl}
          rtl={isRtl(lang)}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-bg-alt px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-0.5 text-base font-semibold">{value}</div>
    </div>
  );
}
