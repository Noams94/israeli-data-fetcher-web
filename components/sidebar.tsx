"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Star, Code2, Info, Clock, Trash2, BarChart3 } from "lucide-react";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";
import { cn } from "@/lib/utils";

const NAV: { href: string; key: "home_nav" | "popular_nav" | "cbs_nav" | "sql_nav" | "about_nav"; Icon: typeof Search }[] = [
  { href: "/", key: "home_nav", Icon: Search },
  { href: "/popular", key: "popular_nav", Icon: Star },
  { href: "/cbs", key: "cbs_nav", Icon: BarChart3 },
  { href: "/sql", key: "sql_nav", Icon: Code2 },
  { href: "/about", key: "about_nav", Icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lang, recentSearches, clearSearches } = useUi();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-s border-card-border bg-bg-alt p-4 md:flex">
      <Link href="/" className="flex items-center gap-2 px-1 py-2">
        <span className="text-2xl">🇮🇱</span>
        <span className="text-sm font-semibold">{t("app_title", lang)}</span>
      </Link>

      <LanguageToggle />

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, key, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-primary-soft text-primary" : "text-text hover:bg-card",
              )}
            >
              <Icon size={16} />
              {t(key, lang)}
            </Link>
          );
        })}
      </nav>

      {recentSearches.length > 0 && (
        <div className="mt-2 border-t border-card-border pt-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} />
              {t("recent_searches", lang)}
            </span>
            <button
              onClick={clearSearches}
              className="inline-flex items-center gap-1 text-muted hover:text-text"
              aria-label={t("clear_history", lang)}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {recentSearches.map((q) => (
              <Link
                key={q}
                href={`/?q=${encodeURIComponent(q)}`}
                className="truncate rounded-md px-2 py-1.5 text-xs text-muted hover:bg-card hover:text-text"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/cbs"
        className="mt-auto rounded-lg border border-card-border p-3 text-[11px] text-muted transition hover:border-primary/50 hover:bg-card"
      >
        <div className="font-medium text-primary">{t("cbs_now_live", lang)}</div>
        <div className="mt-1 leading-4">{t("cbs_description", lang)}</div>
      </Link>
    </aside>
  );
}
