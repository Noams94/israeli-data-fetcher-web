import type { Language } from "./types";

// Client for the CBS (Central Bureau of Statistics / הלמ״ס) time-series API,
// reached through our /api/cbs proxy (see app/api/cbs/[...path]/route.ts).

const PROXY = "/api/cbs/series";
const TIMEOUT_MS = 20_000;

export class CbsError extends Error {
  constructor(
    message: string,
    public readonly kind: "timeout" | "network" | "not_found" | "server" | "api",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "CbsError";
  }
}

export interface CbsCatalogNode {
  path: number[];
  name: string;
  pathDesc?: string | null;
}

export interface CbsObs {
  TimePeriod: string;
  Value: number | null;
}

interface CbsNamedValue {
  value: number;
  name: string;
}

export interface CbsSeries {
  id: number;
  time: CbsNamedValue;
  data: CbsNamedValue;
  unit: CbsNamedValue;
  calc: CbsNamedValue;
  price: CbsNamedValue;
  path: {
    level1?: CbsNamedValue;
    level2?: CbsNamedValue;
    level3?: CbsNamedValue;
    level4?: CbsNamedValue;
    name_id?: CbsNamedValue;
  };
  update: string;
  obs: CbsObs[];
}

async function cbsGet<T>(
  segment: string,
  params: Record<string, string | number | undefined>,
  pick: (body: any) => T,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${PROXY}/${segment}`, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const abortExternal = () => ctrl.abort();
  signal?.addEventListener("abort", abortExternal);

  try {
    const resp = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const body = await resp.json().catch(() => null);

    if (resp.status === 404) {
      throw new CbsError("not found", "not_found", 404);
    }
    if (resp.status >= 500) {
      throw new CbsError(`HTTP ${resp.status}`, "server", resp.status);
    }
    if (!resp.ok || body == null) {
      throw new CbsError(
        (body && (body.error || body.Message)) || "API error",
        "api",
        resp.status,
      );
    }
    return pick(body);
  } catch (err) {
    if (err instanceof CbsError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new CbsError("request timed out", "timeout");
    }
    throw new CbsError(err instanceof Error ? err.message : "network error", "network");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortExternal);
  }
}

function catalogNodes(body: any): CbsCatalogNode[] {
  const list = body?.catalogs?.catalog;
  return Array.isArray(list) ? list : [];
}

/** Top-level subjects (population, prices, health, …). */
export function cbsSubjects(lang: Language, signal?: AbortSignal): Promise<CbsCatalogNode[]> {
  return cbsGet("catalog/level", { id: 1, lang }, catalogNodes, signal);
}

/** Sub-subjects under a level-1 subject code. */
export function cbsSubSubjects(
  subject: number,
  lang: Language,
  signal?: AbortSignal,
): Promise<CbsCatalogNode[]> {
  return cbsGet("catalog/level", { id: 2, subject, lang }, catalogNodes, signal);
}

/** All series leaves beneath a partial path (e.g. [2, 1]). */
export function cbsLeaves(
  path: number[],
  lang: Language,
  signal?: AbortSignal,
): Promise<CbsCatalogNode[]> {
  return cbsGet("catalog/path", { id: path.join(","), lang }, catalogNodes, signal);
}

export interface CbsSeriesArgs {
  path: number[];
  last?: number;
  startPeriod?: string;
  endPeriod?: string;
  lang: Language;
  signal?: AbortSignal;
}

/** The one or more time series (by frequency) sitting at a leaf path. */
export function cbsSeriesByPath({
  path,
  last,
  startPeriod,
  endPeriod,
  lang,
  signal,
}: CbsSeriesArgs): Promise<CbsSeries[]> {
  return cbsGet(
    "data/path",
    { id: path.join(","), last, startPeriod, endPeriod, lang },
    (body) => {
      const s = body?.DataSet?.Series;
      return Array.isArray(s) ? s : [];
    },
    signal,
  );
}

/** Human-readable title for a series, built from its path names. */
export function seriesTitle(s: CbsSeries): string {
  const parts = [
    s.path.name_id?.name,
    s.path.level4?.name,
    s.path.level3?.name,
  ].filter((p) => p && p.trim());
  return parts.join(" · ") || `#${s.id}`;
}

/** Flatten a series' observations into table/export rows with localized keys. */
export function seriesRows(s: CbsSeries, lang: Language): Record<string, unknown>[] {
  const periodKey = lang === "he" ? "תקופה" : "Period";
  const valueKey = lang === "he" ? "ערך" : "Value";
  return s.obs.map((o) => ({ [periodKey]: o.TimePeriod, [valueKey]: o.Value }));
}
