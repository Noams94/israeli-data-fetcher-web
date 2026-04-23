"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { POPULAR_DATASETS, t } from "@/lib/i18n";
import { useUi } from "@/lib/store";

export default function PopularPage() {
  const lang = useUi((s) => s.lang);
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">{t("popular_datasets_title", lang)}</h1>
        <p className="text-sm text-muted">{t("popular_datasets_desc", lang)}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {POPULAR_DATASETS.map((ds) => (
          <Link
            key={ds.title}
            href={`/?q=${encodeURIComponent(ds.query)}`}
            className="idf-card"
          >
            <h3 className="text-base font-semibold">{ds.title}</h3>
            <p className="mt-1 text-xs text-muted">{ds.query}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
              {t("view_dataset", lang)} <ArrowLeft size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
