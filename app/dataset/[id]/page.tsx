"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CkanError, getDataset } from "@/lib/ckan";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";
import { friendlyError, formatDate } from "@/lib/utils";
import { Loading, ErrorBanner } from "@/components/loading";
import { ResourcePreview } from "@/components/resource-preview";

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>();
  const lang = useUi((s) => s.lang);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dataset", id],
    queryFn: ({ signal }) => getDataset(id, signal),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
  });

  const resources = data?.resources ?? [];
  const [picked, setPicked] = useState(0);
  const current = resources[picked];

  if (isLoading) return <Loading />;
  if (isError) {
    const kind = error instanceof CkanError ? error.kind : "unknown";
    return <ErrorBanner message={friendlyError(kind, (k) => t(k, lang))} />;
  }
  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="inline-flex items-center gap-1 self-start text-sm text-muted hover:text-text">
        <ArrowRight size={14} />
        {t("back_to_search", lang)}
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{data.title || data.name}</h1>
        {data.notes?.trim() && (
          <p className="whitespace-pre-wrap text-sm text-muted">{data.notes}</p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label={t("organization", lang)} value={data.organization?.title || data.organization?.name || "—"} />
        <Metric label={t("license", lang)} value={data.license_title || data.license_id || "—"} />
        <Metric label={t("created", lang)} value={formatDate(data.metadata_created)} />
        <Metric label={t("updated", lang)} value={formatDate(data.metadata_modified)} />
      </div>

      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tg) => (
            <span key={tg.id ?? tg.name} className="idf-badge">
              {tg.display_name || tg.name}
            </span>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("resources", lang)}</h2>
        {resources.length === 0 ? (
          <div className="text-sm text-muted">{t("no_results", lang)}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {resources.map((r, i) => {
              const active = i === picked;
              return (
                <button
                  key={r.id}
                  onClick={() => setPicked(i)}
                  className="idf-chip"
                  data-active={active}
                >
                  <span className="truncate max-w-[240px]">
                    {r.name || r.description || "—"}
                  </span>
                  <span className="ms-2 rounded bg-bg-alt px-1.5 py-0.5 text-[10px] text-muted">
                    {(r.format || "?").toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {current && (
        <section className="flex flex-col gap-3 rounded-lg border border-card-border bg-bg-alt/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{current.name || current.description || "—"}</div>
            {current.url && (
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="idf-btn-ghost"
              >
                {t("download", lang)}
              </a>
            )}
          </div>
          <ResourcePreview resource={current} />
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-bg-alt px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
