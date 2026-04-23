"use client";

import Link from "next/link";
import { ArrowLeft, FolderOpen, CalendarDays, FileStack } from "lucide-react";
import type { CkanDataset } from "@/lib/types";
import { t } from "@/lib/i18n";
import { useUi } from "@/lib/store";
import { formatDate, truncate } from "@/lib/utils";

export function DatasetCard({ ds }: { ds: CkanDataset }) {
  const lang = useUi((s) => s.lang);
  const title = ds.title || ds.name;
  const desc = truncate(ds.notes?.trim() ?? "");
  const org = ds.organization?.title || ds.organization?.name || "—";
  const updated = formatDate(ds.metadata_modified);
  const resCount = ds.resources?.length ?? ds.num_resources ?? 0;
  const tags = (ds.tags ?? []).slice(0, 5).map((tg) => tg.display_name || tg.name);

  return (
    <Link href={`/dataset/${ds.id}`} className="idf-card block animate-fade-in">
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      {desc && <p className="line-clamp-2 text-sm text-muted">{desc}</p>}
      <div className="idf-meta-row mt-2">
        <span className="inline-flex items-center gap-1">
          <FolderOpen size={13} />
          {org}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={13} />
          {updated}
        </span>
        <span className="inline-flex items-center gap-1">
          <FileStack size={13} />
          {t("resource_count", lang, { n: resCount })}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tg) => (
            <span key={tg} className="idf-badge">
              {tg}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
        {t("view_dataset", lang)} <ArrowLeft size={14} />
      </div>
    </Link>
  );
}
