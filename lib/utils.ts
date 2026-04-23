import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function truncate(text: string, n = 240): string {
  if (!text) return "";
  return text.length > n ? text.slice(0, n) + "…" : text;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export function friendlyError(
  kind: "timeout" | "network" | "not_found" | "server" | "api" | "unknown",
  t: (k: string) => string,
): string {
  switch (kind) {
    case "timeout":
      return t("error_timeout");
    case "network":
      return t("error_network");
    case "not_found":
      return t("error_not_found");
    case "server":
      return t("error_server");
    default:
      return t("error_generic");
  }
}
