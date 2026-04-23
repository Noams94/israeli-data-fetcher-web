import type {
  CkanDataset,
  CkanDatastoreResult,
  CkanOrg,
  CkanSearchResult,
} from "./types";

const BASE =
  process.env.NEXT_PUBLIC_CKAN_BASE ?? "https://data.gov.il/api/3/action";

const TIMEOUT_MS = 20_000;

export class CkanError extends Error {
  constructor(
    message: string,
    public readonly kind: "timeout" | "network" | "not_found" | "server" | "api",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "CkanError";
  }
}

async function ckanGet<T>(
  action: string,
  params: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${BASE}/${action}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const abortExternal = () => ctrl.abort();
  signal?.addEventListener("abort", abortExternal);

  try {
    const resp = await fetch(url.toString(), {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });

    if (resp.status === 404) {
      throw new CkanError(`${action}: not found`, "not_found", 404);
    }
    if (resp.status >= 500) {
      throw new CkanError(`${action}: HTTP ${resp.status}`, "server", resp.status);
    }

    const body = (await resp.json()) as { success: boolean; result?: T; error?: { message?: string } };
    if (!body.success) {
      throw new CkanError(body.error?.message ?? "API error", "api", resp.status);
    }
    return body.result as T;
  } catch (err) {
    if (err instanceof CkanError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new CkanError("request timed out", "timeout");
    }
    throw new CkanError(
      err instanceof Error ? err.message : "network error",
      "network",
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortExternal);
  }
}

export interface SearchDatasetsArgs {
  query?: string;
  org?: string | null;
  tags?: string[];
  format?: string | null;
  rows?: number;
  start?: number;
  sort?: string;
  signal?: AbortSignal;
}

export async function searchDatasets({
  query,
  org,
  tags,
  format,
  rows = 12,
  start = 0,
  sort = "metadata_modified desc",
  signal,
}: SearchDatasetsArgs): Promise<CkanSearchResult> {
  const fq: string[] = [];
  if (org) fq.push(`organization:"${org}"`);
  if (tags?.length) for (const t of tags) fq.push(`tags:"${t}"`);
  if (format) fq.push(`res_format:"${format.toUpperCase()}"`);

  return ckanGet<CkanSearchResult>(
    "package_search",
    {
      q: query && query.trim() ? query.trim() : "*:*",
      rows,
      start,
      sort,
      fq: fq.length ? fq.join(" AND ") : undefined,
    },
    signal,
  );
}

export function getDataset(id: string, signal?: AbortSignal): Promise<CkanDataset> {
  return ckanGet<CkanDataset>("package_show", { id }, signal);
}

export function listOrganizations(signal?: AbortSignal): Promise<CkanOrg[]> {
  return ckanGet<CkanOrg[]>(
    "organization_list",
    { all_fields: "true" },
    signal,
  );
}

export async function listTags(query?: string, signal?: AbortSignal): Promise<string[]> {
  // data.gov.il sometimes returns full objects even with all_fields=false — normalize.
  const raw = await ckanGet<unknown>(
    "tag_list",
    { all_fields: "false", query: query || undefined },
    signal,
  );
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      out.push(item);
    } else if (item && typeof item === "object") {
      const obj = item as { display_name?: unknown; name?: unknown };
      const name =
        typeof obj.display_name === "string"
          ? obj.display_name
          : typeof obj.name === "string"
            ? obj.name
            : "";
      if (name) out.push(name);
    }
  }
  return out;
}

export interface DatastoreSearchArgs {
  resourceId: string;
  query?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  sort?: string;
  signal?: AbortSignal;
}

export function datastoreSearch({
  resourceId,
  query,
  filters,
  limit = 100,
  offset = 0,
  sort,
  signal,
}: DatastoreSearchArgs): Promise<CkanDatastoreResult> {
  return ckanGet<CkanDatastoreResult>(
    "datastore_search",
    {
      resource_id: resourceId,
      q: query || undefined,
      limit,
      offset,
      sort,
      filters: filters ? JSON.stringify(filters) : undefined,
    },
    signal,
  );
}

export function datastoreSearchSql(
  sql: string,
  signal?: AbortSignal,
): Promise<CkanDatastoreResult> {
  return ckanGet<CkanDatastoreResult>("datastore_search_sql", { sql }, signal);
}

export function buildApiUrl(action: string, params: Record<string, string | number>): string {
  const url = new URL(`${BASE}/${action}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  return url.toString();
}

export const CKAN_BASE = BASE;
