"use client";

import { POPULAR_TOPICS, t } from "@/lib/i18n";
import { useUi } from "@/lib/store";

export function QuickTopics({ onPick }: { onPick: (term: string) => void }) {
  const lang = useUi((s) => s.lang);
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {POPULAR_TOPICS.map(({ key, term }) => (
        <button
          key={key}
          className="idf-chip"
          onClick={() => onPick(term)}
          type="button"
        >
          {t(key, lang)}
        </button>
      ))}
    </div>
  );
}
