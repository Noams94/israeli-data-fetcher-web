import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CkanError,
  buildApiUrl,
  datastoreSearch,
  getDataset,
  searchDatasets,
} from "@/lib/ckan";

const BASE = "https://data.gov.il/api/3/action";

function mockFetchOnce(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchDatasets", () => {
  it("parses results and count", async () => {
    mockFetchOnce({
      success: true,
      result: { count: 2, results: [{ id: "a", name: "a", title: "אוכלוסייה", resources: [] }] },
    });
    const out = await searchDatasets({ query: "אוכלוסייה" });
    expect(out.count).toBe(2);
    expect(out.results[0].title).toBe("אוכלוסייה");
  });

  it("builds fq with org, tags, and format", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ success: true, result: { count: 0, results: [] } }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await searchDatasets({ query: "x", org: "moe", tags: ["חינוך"], format: "csv" });
    const called = fetchMock.mock.calls[0][0] as string;
    const url = new URL(called);
    expect(url.pathname.endsWith("/package_search")).toBe(true);
    const fq = url.searchParams.get("fq") ?? "";
    expect(fq).toContain('organization:"moe"');
    expect(fq).toContain('tags:"חינוך"');
    expect(fq).toContain('res_format:"CSV"');
  });

  it("maps 404 to CkanError(not_found)", async () => {
    mockFetchOnce({}, { status: 404 });
    const err = await getDataset("missing").catch((e) => e);
    expect(err).toBeInstanceOf(CkanError);
    expect(err.kind).toBe("not_found");
  });

  it("maps 500 to CkanError(server)", async () => {
    mockFetchOnce({}, { status: 500 });
    const err = await getDataset("x").catch((e) => e);
    expect(err).toBeInstanceOf(CkanError);
    expect(err.kind).toBe("server");
  });

  it("maps success:false body to CkanError(api)", async () => {
    mockFetchOnce({ success: false, error: { message: "bad" } });
    await expect(searchDatasets({ query: "x" })).rejects.toMatchObject({ kind: "api" });
  });
});

describe("datastoreSearch", () => {
  it("JSON-encodes filters", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ success: true, result: { total: 0, records: [], fields: [] } }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);
    await datastoreSearch({ resourceId: "R1", filters: { עיר: "תל אביב" } });
    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname.endsWith("/datastore_search")).toBe(true);
    const f = url.searchParams.get("filters")!;
    expect(JSON.parse(f)).toEqual({ עיר: "תל אביב" });
  });
});

describe("buildApiUrl", () => {
  it("encodes parameters and targets the base URL", () => {
    const url = buildApiUrl("datastore_search", { resource_id: "R1", limit: 10 });
    expect(url.startsWith(BASE + "/datastore_search?")).toBe(true);
    expect(url).toContain("resource_id=R1");
    expect(url).toContain("limit=10");
  });
});
