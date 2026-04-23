"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { t } from "@/lib/i18n";
import { useUi } from "@/lib/store";

interface Props {
  initial?: string;
  onSubmit: (query: string) => void;
}

export function SearchBar({ initial = "", onSubmit }: Props) {
  const lang = useUi((s) => s.lang);
  const [value, setValue] = useState(initial);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={submit} className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("search_placeholder", lang)}
        className="idf-input pe-14"
        aria-label={t("search_button", lang)}
      />
      <button
        type="submit"
        className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-primary p-2.5 text-white transition hover:bg-primary-hover"
        aria-label={t("search_button", lang)}
      >
        <Search size={16} />
      </button>
    </form>
  );
}
