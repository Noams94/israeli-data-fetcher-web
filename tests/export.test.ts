// @vitest-environment node
import { describe, it, expect } from "vitest";
import { toCsv, toJson } from "@/lib/export";

async function blobBytes(b: Blob): Promise<Uint8Array> {
  return new Uint8Array(await b.arrayBuffer());
}

async function blobText(b: Blob): Promise<string> {
  // ignoreBOM: true — otherwise TextDecoder strips the BOM we care about
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(await blobBytes(b));
}

describe("CSV export", () => {
  it("prepends a UTF-8 BOM and preserves Hebrew", async () => {
    const blob = toCsv([
      { עיר: "תל אביב", n: 1 },
      { עיר: "ירושלים", n: 2 },
    ]);
    const buf = await blobBytes(blob);
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    const txt = await blobText(blob);
    expect(txt).toContain("תל אביב");
    expect(txt).toContain("ירושלים");
  });

  it("escapes commas, quotes, and newlines", async () => {
    const blob = toCsv([{ a: 'he said "hi"', b: "line1\nline2", c: "x,y" }]);
    const txt = await blobText(blob);
    expect(txt).toContain('"he said ""hi"""');
    expect(txt).toContain('"line1\nline2"');
    expect(txt).toContain('"x,y"');
  });

  it("drops CKAN internal columns (_full_text, rank)", async () => {
    const blob = toCsv([{ a: 1, _full_text: "xxx", rank: 0.5 }]);
    const txt = await blobText(blob);
    expect(txt.startsWith("\uFEFFa\n")).toBe(true);
    expect(txt).not.toContain("_full_text");
    expect(txt).not.toContain("rank");
  });
});

describe("JSON export", () => {
  it("preserves non-ASCII without escaping", async () => {
    const blob = toJson([{ עיר: "חיפה" }]);
    const txt = await blobText(blob);
    expect(JSON.parse(txt)).toEqual([{ עיר: "חיפה" }]);
    expect(txt).toContain("חיפה");
  });
});
