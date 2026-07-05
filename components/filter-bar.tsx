"use client";

import { useQuery } from "@tanstack/react-query";
import { listOrganizations, listTags } from "@/lib/ckan";
import { t } from "@/lib/i18n";
import { useUi } from "@/lib/store";

interface Props {
  org: string | null;
  format: string | null;
  tags: string[];
  onChange: (patch: Partial<{ org: string | null; format: string | null; tags: string[] }>) => void;
}

// Exact res_format facet values on data.gov.il, ordered by dataset count.
// Solr fq matching is case-sensitive — "GeoJSON" must keep its mixed case.
const FORMATS = ["CSV", "XLSX", "XLS", "JSON", "GeoJSON", "XML", "ZIP", "PDF"];

export function FilterBar({ org, format, tags, onChange }: Props) {
  const lang = useUi((s) => s.lang);

  const orgs = useQuery({
    queryKey: ["orgs"],
    queryFn: ({ signal }) => listOrganizations(signal),
    staleTime: 60 * 60 * 1000,
  });

  const tagList = useQuery({
    queryKey: ["tags"],
    queryFn: ({ signal }) => listTags(undefined, signal),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t("filter_org", lang)}
        <select
          value={org ?? ""}
          onChange={(e) => onChange({ org: e.target.value || null })}
          className="idf-select"
        >
          <option value="">{t("all", lang)}</option>
          {(orgs.data ?? []).map((o) => (
            <option key={o.name} value={o.name}>
              {o.title || o.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t("filter_format", lang)}
        <select
          value={format ?? ""}
          onChange={(e) => onChange({ format: e.target.value || null })}
          className="idf-select"
        >
          <option value="">{t("all", lang)}</option>
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t("filter_tags", lang)}
        <select
          multiple
          value={tags}
          onChange={(e) => {
            const picked = Array.from(e.target.selectedOptions).map((o) => o.value);
            onChange({ tags: picked });
          }}
          className="idf-select max-h-28"
        >
          {(tagList.data ?? []).slice(0, 200).map((tg) => (
            <option key={tg} value={tg}>
              {tg}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
