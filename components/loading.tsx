"use client";

import { Loader2 } from "lucide-react";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";

export function Loading({ text }: { text?: string }) {
  const lang = useUi((s) => s.lang);
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted">
      <Loader2 className="animate-spin" size={18} />
      <span>{text ?? t("loading", lang)}</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}
