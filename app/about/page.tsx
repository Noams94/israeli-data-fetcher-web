"use client";

import { t } from "@/lib/i18n";
import { useUi } from "@/lib/store";

export default function AboutPage() {
  const lang = useUi((s) => s.lang);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("about_title", lang)}</h1>
      <p className="text-sm text-muted">{t("about_body", lang)}</p>
      <ul className="list-inside list-disc text-sm text-muted">
        <li>
          data.gov.il ·{" "}
          <a className="idf-link" href="https://data.gov.il" target="_blank" rel="noreferrer">
            https://data.gov.il
          </a>
        </li>
        <li>
          CKAN API docs ·{" "}
          <a
            className="idf-link"
            href="https://docs.ckan.org/en/latest/api/"
            target="_blank"
            rel="noreferrer"
          >
            docs.ckan.org
          </a>
        </li>
      </ul>
    </div>
  );
}
