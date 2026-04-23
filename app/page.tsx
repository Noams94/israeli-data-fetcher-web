"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { searchDatasets, CkanError } from "@/lib/ckan";
import { t } from "@/lib/i18n";
import { useUi } from "@/lib/store";
import { friendlyError } from "@/lib/utils";
import { SearchBar } from "@/components/search-bar";
import { QuickTopics } from "@/components/quick-topics";
import { DatasetCard } from "@/components/dataset-card";
import { FilterBar } from "@/components/filter-bar";
import { Loading, ErrorBanner } from "@/components/loading";

const ROWS = 12;

function SearchView() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = useUi((s) => s.lang);
  const pushSearch = useUi((s) => s.pushSearch);

  const query = sp.get("q") ?? "";
  const org = sp.get("org") || null;
  const format = sp.get("fmt") || null;
  const tags = useMemo(() => sp.getAll("tag"), [sp]);
  const page = Math.max(0, Number(sp.get("page") ?? "0"));

  const [showFilters, setShowFilters] = useState(false);

  const search = useQuery({
    queryKey: ["search", query, org, format, tags, page],
    queryFn: ({ signal }) =>
      searchDatasets({
        query,
        org,
        tags,
        format,
        rows: ROWS,
        start: page * ROWS,
        signal,
      }),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const updateParams = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        next.delete(k);
        if (v === null || v === undefined) continue;
        if (Array.isArray(v)) {
          for (const x of v) next.append(k, x);
        } else {
          next.set(k, v);
        }
      }
      router.push(`/?${next.toString()}`);
    },
    [router, sp],
  );

  const submitQuery = (q: string) => {
    pushSearch(q);
    updateParams({ q: q || null, page: "0" });
  };

  const pickTopic = (term: string) => submitQuery(term);

  const total = search.data?.count ?? 0;
  const results = search.data?.results ?? [];
  const pages = Math.max(1, Math.ceil(total / ROWS));

  return (
    <div className="flex flex-col gap-6">
      <section className="pt-4 text-center">
        <h1 className="idf-hero-title mb-1 text-3xl font-bold md:text-4xl">
          {t("app_title", lang)}
        </h1>
        <p className="text-sm text-muted">{t("app_tagline", lang)}</p>
      </section>

      <SearchBar initial={query} onSubmit={submitQuery} />

      <QuickTopics onPick={pickTopic} />

      <details
        className="rounded-lg border border-card-border bg-bg-alt"
        open={showFilters}
        onToggle={(e) => setShowFilters((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">
          {t("filters", lang)}
        </summary>
        <div className="border-t border-card-border p-4">
          <FilterBar
            org={org}
            format={format}
            tags={tags}
            onChange={(patch) => {
              const next: Record<string, string | string[] | null> = { page: "0" };
              if ("org" in patch) next.org = patch.org ?? null;
              if ("format" in patch) next.fmt = patch.format ?? null;
              if ("tags" in patch) next.tag = patch.tags ?? null;
              updateParams(next);
            }}
          />
        </div>
      </details>

      {!query.trim() ? (
        <div className="rounded-lg border border-card-border bg-bg-alt px-4 py-8 text-center text-sm text-muted">
          {t("empty_hint", lang)}
        </div>
      ) : search.isLoading ? (
        <Loading />
      ) : search.isError ? (
        <ErrorBanner
          message={friendlyError(
            search.error instanceof CkanError ? search.error.kind : "unknown",
            (k) => t(k, lang),
          )}
        />
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-bg-alt px-4 py-8 text-center text-sm text-muted">
          {t("no_results", lang)}
        </div>
      ) : (
        <>
          <div className="text-xs text-muted">{t("results_count", lang, { n: total })}</div>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((ds) => (
              <DatasetCard key={ds.id} ds={ds} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 0}
              className="idf-btn-secondary"
            >
              {t("prev", lang)}
            </button>
            <div className="text-xs text-muted">
              {t("page", lang)} {page + 1} {t("of", lang)} {pages}
            </div>
            <button
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page + 1 >= pages}
              className="idf-btn-secondary"
            >
              {t("next", lang)}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchView />
    </Suspense>
  );
}
