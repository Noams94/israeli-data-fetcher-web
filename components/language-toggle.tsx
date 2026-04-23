"use client";

import { useUi } from "@/lib/store";
import type { Language } from "@/lib/types";
import { LANGUAGES } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useUi();
  return (
    <div className="inline-flex rounded-pill border border-card-border bg-card p-1" role="tablist">
      {(Object.keys(LANGUAGES) as Language[]).map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            role="tab"
            aria-selected={active}
            onClick={() => setLang(code)}
            className={`rounded-pill px-3 py-1 text-xs transition ${
              active ? "bg-primary text-white" : "text-muted hover:text-text"
            }`}
          >
            {LANGUAGES[code]}
          </button>
        );
      })}
    </div>
  );
}
