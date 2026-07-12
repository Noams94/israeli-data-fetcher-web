"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, BarChart3, Table2 } from "lucide-react";
import {
  CbsError,
  cbsSubjects,
  cbsSubSubjects,
  cbsLeaves,
  cbsSeriesByPath,
  seriesTitle,
  seriesRows,
  type CbsCatalogNode,
  type CbsSeries,
} from "@/lib/cbs";
import { t } from "@/lib/i18n";
import { useUi } from "@/lib/store";
import { friendlyError } from "@/lib/utils";
import { Loading, ErrorBanner } from "@/components/loading";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export-buttons";

type Range = "12" | "60" | "120" | "all";
const RANGE_LAST: Record<Range, number | undefined> = {
  "12": 12,
  "60": 60,
  "120": 120,
  all: undefined,
};

export default function CbsPage() {
  const lang = useUi((s) => s.lang);
  const rtl = lang === "he";

  const [subject, setSubject] = useState<CbsCatalogNode | null>(null);
  const [subsubject, setSubsubject] = useState<CbsCatalogNode | null>(null);
  const [leaf, setLeaf] = useState<CbsCatalogNode | null>(null);
  const [range, setRange] = useState<Range>("120");

  const subjectsQ = useQuery({
    queryKey: ["cbs", "subjects", lang],
    queryFn: ({ signal }) => cbsSubjects(lang, signal),
    staleTime: 30 * 60 * 1000,
  });

  const subSubjectsQ = useQuery({
    queryKey: ["cbs", "subsubjects", subject?.path[0], lang],
    queryFn: ({ signal }) => cbsSubSubjects(subject!.path[0], lang, signal),
    enabled: Boolean(subject),
    staleTime: 30 * 60 * 1000,
  });

  const leavesQ = useQuery({
    queryKey: ["cbs", "leaves", subsubject?.path.join(","), lang],
    queryFn: ({ signal }) => cbsLeaves(subsubject!.path, lang, signal),
    enabled: Boolean(subsubject),
    staleTime: 30 * 60 * 1000,
  });

  const seriesQ = useQuery({
    queryKey: ["cbs", "series", leaf?.path.join(","), range, lang],
    queryFn: ({ signal }) =>
      cbsSeriesByPath({ path: leaf!.path, last: RANGE_LAST[range], lang, signal }),
    enabled: Boolean(leaf),
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });

  const goSubject = (n: CbsCatalogNode) => {
    setSubject(n);
    setSubsubject(null);
    setLeaf(null);
  };
  const goSubsubject = (n: CbsCatalogNode) => {
    setSubsubject(n);
    setLeaf(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="pt-4 text-center">
        <h1 className="idf-hero-title mb-1 inline-flex items-center gap-2 text-3xl font-bold md:text-4xl">
          <BarChart3 className="text-primary" size={28} />
          {t("cbs_title", lang)}
        </h1>
        <p className="text-sm text-muted">{t("cbs_tagline", lang)}</p>
      </section>

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm">
        <Crumb
          label={t("cbs_subjects", lang)}
          active={!subject}
          onClick={() => {
            setSubject(null);
            setSubsubject(null);
            setLeaf(null);
          }}
        />
        {subject && (
          <>
            <Sep rtl={rtl} />
            <Crumb
              label={subject.name}
              active={Boolean(subject) && !subsubject}
              onClick={() => {
                setSubsubject(null);
                setLeaf(null);
              }}
            />
          </>
        )}
        {subsubject && (
          <>
            <Sep rtl={rtl} />
            <Crumb
              label={subsubject.name}
              active={Boolean(subsubject) && !leaf}
              onClick={() => setLeaf(null)}
            />
          </>
        )}
        {leaf && (
          <>
            <Sep rtl={rtl} />
            <Crumb label={leaf.name} active onClick={() => {}} />
          </>
        )}
      </nav>

      {/* Level 4: series data */}
      {leaf ? (
        seriesQ.isLoading ? (
          <Loading />
        ) : seriesQ.isError ? (
          <ErrorBanner
            message={friendlyError(
              seriesQ.error instanceof CbsError ? seriesQ.error.kind : "unknown",
              (k) => t(k, lang),
            )}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">{t("cbs_range", lang)}:</span>
              <select
                className="idf-select w-auto"
                value={range}
                onChange={(e) => setRange(e.target.value as Range)}
              >
                <option value="12">{t("cbs_range_12", lang)}</option>
                <option value="60">{t("cbs_range_60", lang)}</option>
                <option value="120">{t("cbs_range_120", lang)}</option>
                <option value="all">{t("cbs_range_all", lang)}</option>
              </select>
            </div>
            {(seriesQ.data ?? []).map((s) => (
              <SeriesCard key={s.id} series={s} lang={lang} rtl={rtl} />
            ))}
          </div>
        )
      ) : /* Level 3: leaves (series list) */ subsubject ? (
        leavesQ.isLoading ? (
          <Loading />
        ) : leavesQ.isError ? (
          <ErrorBanner
            message={friendlyError(
              leavesQ.error instanceof CbsError ? leavesQ.error.kind : "unknown",
              (k) => t(k, lang),
            )}
          />
        ) : (leavesQ.data ?? []).length === 0 ? (
          <Empty text={t("cbs_no_series", lang)} />
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="text-xs text-muted">{t("cbs_series_list", lang)}</div>
            {leavesQ.data!.map((n) => (
              <button
                key={n.path.join(",")}
                onClick={() => setLeaf(n)}
                className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-bg-alt px-4 py-2.5 text-start text-sm transition hover:border-primary/50 hover:bg-card"
              >
                <span className="truncate">{n.name}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-primary">
                  <Table2 size={13} />
                  {t("cbs_view_series", lang)}
                </span>
              </button>
            ))}
          </div>
        )
      ) : /* Level 2: sub-subjects */ subject ? (
        subSubjectsQ.isLoading ? (
          <Loading />
        ) : subSubjectsQ.isError ? (
          <ErrorBanner
            message={friendlyError(
              subSubjectsQ.error instanceof CbsError ? subSubjectsQ.error.kind : "unknown",
              (k) => t(k, lang),
            )}
          />
        ) : (
          <ChipGrid nodes={subSubjectsQ.data ?? []} onPick={goSubsubject} />
        )
      ) : /* Level 1: subjects */ subjectsQ.isLoading ? (
        <Loading />
      ) : subjectsQ.isError ? (
        <ErrorBanner
          message={friendlyError(
            subjectsQ.error instanceof CbsError ? subjectsQ.error.kind : "unknown",
            (k) => t(k, lang),
          )}
        />
      ) : (
        <>
          <div className="text-center text-sm text-muted">{t("cbs_pick_subject", lang)}</div>
          <ChipGrid nodes={subjectsQ.data ?? []} onPick={goSubject} />
        </>
      )}
    </div>
  );
}

function ChipGrid({
  nodes,
  onPick,
}: {
  nodes: CbsCatalogNode[];
  onPick: (n: CbsCatalogNode) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((n) => (
        <button
          key={n.path.join(",")}
          onClick={() => onPick(n)}
          className="rounded-lg border border-card-border bg-bg-alt px-4 py-3 text-start text-sm transition hover:border-primary/50 hover:bg-card"
        >
          {n.name}
        </button>
      ))}
    </div>
  );
}

function SeriesCard({
  series,
  lang,
  rtl,
}: {
  series: CbsSeries;
  lang: "he" | "en";
  rtl: boolean;
}) {
  const rows = seriesRows(series, lang);
  const baseName = `cbs_${series.id}`;
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-card-border bg-bg-alt/50 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{seriesTitle(series)}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
          {series.time?.name && (
            <span>
              {t("cbs_frequency", lang)}: <b className="text-text">{series.time.name}</b>
            </span>
          )}
          {series.unit?.name && (
            <span>
              {t("cbs_unit", lang)}: <b className="text-text">{series.unit.name}</b>
            </span>
          )}
          {series.data?.name && (
            <span>
              {t("cbs_data_type", lang)}: <b className="text-text">{series.data.name}</b>
            </span>
          )}
          {series.update && (
            <span>
              {t("updated", lang)}: <b className="text-text">{series.update}</b>
            </span>
          )}
        </div>
      </div>
      <ExportButtons rows={rows} baseName={baseName} rtl={rtl} />
      <DataTable rows={rows} />
    </section>
  );
}

function Crumb({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      className={
        active
          ? "max-w-[220px] truncate font-medium text-text"
          : "max-w-[220px] truncate text-muted hover:text-primary"
      }
    >
      {label}
    </button>
  );
}

function Sep({ rtl }: { rtl: boolean }) {
  return <ChevronLeft size={14} className={rtl ? "text-muted" : "rotate-180 text-muted"} />;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-bg-alt px-4 py-8 text-center text-sm text-muted">
      {text}
    </div>
  );
}
