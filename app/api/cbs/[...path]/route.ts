import { NextResponse } from "next/server";

// The CBS (Central Bureau of Statistics / הלמ״ס) API sends no CORS headers and
// requires a User-Agent header that browsers refuse to set. So — unlike
// data.gov.il, which the client hits directly — CBS traffic is proxied through
// this route handler. It is a pure pass-through: nothing is stored server-side,
// preserving the app's "no data retained" promise.

const CBS_BASE = "https://apis.cbs.gov.il";
const TIMEOUT_MS = 20_000;

// Only these read-only series endpoints are reachable through the proxy.
const ALLOWED_PREFIXES = [
  "series/catalog/level",
  "series/catalog/path",
  "series/data/path",
  "series/data/list",
];

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { path: string[] } },
) {
  const path = (params.path ?? []).join("/");
  if (!ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}`))) {
    return NextResponse.json({ error: "endpoint not allowed" }, { status: 403 });
  }

  const incoming = new URL(req.url);
  const target = new URL(`${CBS_BASE}/${path}`);
  for (const [k, v] of incoming.searchParams) target.searchParams.set(k, v);
  // Always JSON, regardless of what the client asked for.
  target.searchParams.set("format", "json");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(target.toString(), {
      signal: ctrl.signal,
      headers: {
        // Mandatory for CBS queries.
        "User-Agent": "israeli-data-fetcher (github.com/noamkeshet)",
        Accept: "application/json",
      },
    });

    const text = await resp.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      // CBS occasionally answers non-JSON (e.g. an HTML error page).
      return NextResponse.json(
        { error: "upstream returned a non-JSON response" },
        { status: 502 },
      );
    }

    // CBS signals errors with an HTTP 200 + { "Message": "Error: ..." }.
    if (
      body &&
      typeof body === "object" &&
      "Message" in body &&
      typeof (body as { Message: unknown }).Message === "string" &&
      (body as { Message: string }).Message.startsWith("Error")
    ) {
      return NextResponse.json(body, { status: 404 });
    }

    return NextResponse.json(body, {
      status: resp.ok ? 200 : resp.status,
      // Series data updates infrequently; let the edge cache it briefly.
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
    });
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "request timed out" : "upstream fetch failed" },
      { status: isTimeout ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
