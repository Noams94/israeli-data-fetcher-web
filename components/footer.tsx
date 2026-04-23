"use client";

import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";

export function Footer() {
  const lang = useUi((s) => s.lang);
  return (
    <footer className="mt-12 border-t border-card-border pt-6 pb-8 text-center text-xs text-muted">
      <div>{t("footer_tagline", lang)}</div>
      <div className="mt-1 opacity-80">{t("footer_privacy", lang)}</div>
    </footer>
  );
}
