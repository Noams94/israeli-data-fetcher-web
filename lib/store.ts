"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "./types";

interface UiState {
  lang: Language;
  recentSearches: string[];
  setLang: (lang: Language) => void;
  pushSearch: (query: string) => void;
  clearSearches: () => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      lang: "he",
      recentSearches: [],
      setLang: (lang) => set({ lang }),
      pushSearch: (query) =>
        set((s) => {
          const q = query.trim();
          if (!q) return {};
          const rs = [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 8);
          return { recentSearches: rs };
        }),
      clearSearches: () => set({ recentSearches: [] }),
    }),
    { name: "idf.ui.v1" },
  ),
);
