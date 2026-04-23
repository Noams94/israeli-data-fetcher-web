"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Link as LinkIcon, Check } from "lucide-react";
import { useUi } from "@/lib/store";
import { t } from "@/lib/i18n";
import { toCsv, toJson, toXlsx, downloadBlob } from "@/lib/export";

interface Props {
  rows: Record<string, unknown>[];
  baseName: string;
  apiUrl?: string;
  rtl?: boolean;
}

export function ExportButtons({ rows, baseName, apiUrl, rtl }: Props) {
  const lang = useUi((s) => s.lang);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"xlsx" | null>(null);

  const safeName = (baseName || "dataset").replace(/[\/\\?%*:|"<>]/g, "_");

  const handleCsv = () => downloadBlob(toCsv(rows), `${safeName}.csv`);
  const handleJson = () => downloadBlob(toJson(rows), `${safeName}.json`);
  const handleXlsx = async () => {
    setBusy("xlsx");
    try {
      const blob = await toXlsx(rows, { sheetName: safeName, rtl });
      downloadBlob(blob, `${safeName}.xlsx`);
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async () => {
    if (!apiUrl) return;
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const disabled = rows.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={handleCsv} disabled={disabled} className="idf-btn-primary">
        <Download size={14} className="me-1.5" />
        {t("export_csv", lang)}
      </button>
      <button onClick={handleXlsx} disabled={disabled || busy === "xlsx"} className="idf-btn-secondary">
        <FileSpreadsheet size={14} className="me-1.5" />
        {busy === "xlsx" ? t("loading", lang) : t("export_excel", lang)}
      </button>
      <button onClick={handleJson} disabled={disabled} className="idf-btn-secondary">
        <FileJson size={14} className="me-1.5" />
        {t("export_json", lang)}
      </button>
      {apiUrl && (
        <button onClick={handleCopy} className="idf-btn-ghost">
          {copied ? <Check size={14} className="me-1.5 text-primary" /> : <LinkIcon size={14} className="me-1.5" />}
          {copied ? t("api_url_copied", lang) : t("copy_api_url", lang)}
        </button>
      )}
    </div>
  );
}
