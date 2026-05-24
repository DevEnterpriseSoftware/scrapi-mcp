import { describe, it, expect, vi, afterEach } from "vitest";
import type { Request } from "express";
import { parseConfig, scrapeUrl, configSchema, scrapeToolInputSchema } from "../index.js";
import { z } from "zod";

// Helper to create a minimal mock Request with query params
function mockRequest(query: Record<string, unknown> = {}): Request {
  return { query } as unknown as Request;
}

// Helper to encode a config object to base64 JSON (as Smithery sends it)
function encodeConfig(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

// ─── parseConfig ────────────────────────────────────────────────────────────

describe("parseConfig", () => {
  it("returns an empty object when no config query param is present", () => {
    expect(parseConfig(mockRequest())).toEqual({});
  });

  it("decodes a valid base64-encoded JSON object", () => {
    const req = mockRequest({ config: encodeConfig({ scrapiApiKey: "test-key" }) });
    expect(parseConfig(req)).toEqual({ scrapiApiKey: "test-key" });
  });

  it("returns an empty object for malformed base64", () => {
    const req = mockRequest({ config: "!!!not-valid-base64!!!" });
    expect(parseConfig(req)).toEqual({});
  });

  it("returns an empty object when the decoded value is not JSON", () => {
    const req = mockRequest({ config: Buffer.from("not json").toString("base64") });
    expect(parseConfig(req)).toEqual({});
  });

  it("returns an empty object when the decoded JSON is an array (not an object)", () => {
    const req = mockRequest({ config: encodeConfig([1, 2, 3]) });
    expect(parseConfig(req)).toEqual({});
  });

  it("returns an empty object when config param is an array (multi-value query param)", () => {
    const req = mockRequest({ config: ["a", "b"] });
    expect(parseConfig(req)).toEqual({});
  });

  it("returns an empty object when config param is null", () => {
    const req = mockRequest({ config: null });
    expect(parseConfig(req)).toEqual({});
  });
});

// ─── configSchema ────────────────────────────────────────────────────────────

describe("configSchema", () => {
  it("accepts an object with a string scrapiApiKey", () => {
    expect(() => configSchema.parse({ scrapiApiKey: "abc" })).not.toThrow();
  });

  it("accepts an object with no scrapiApiKey (optional field)", () => {
    expect(() => configSchema.parse({})).not.toThrow();
  });

  it("rejects when scrapiApiKey is not a string", () => {
    expect(() => configSchema.parse({ scrapiApiKey: 123 })).toThrow();
  });
});

// ─── scrapeToolInputSchema ──────────────────────────────────────────────────

describe("scrapeToolInputSchema", () => {
  const schema = z.object(scrapeToolInputSchema);

  it("accepts a valid URL with no browserCommands", () => {
    const parsed = schema.safeParse({ url: "https://example.com" });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const parsed = schema.safeParse({ url: "not-a-url" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("Invalid URL");
    }
  });

  it("rejects non-string browserCommands", () => {
    const parsed = schema.safeParse({ url: "https://example.com", browserCommands: 123 });
    expect(parsed.success).toBe(false);
  });
});

// ─── scrapeUrl ───────────────────────────────────────────────────────────────

describe("scrapeUrl", () => {
  const TEST_KEY = "test-api-key";

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns content with HTML mime type on a successful HTML response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "<html><body>Hello</body></html>",
      }),
    );

    const result = await scrapeUrl("https://example.com", "HTML", TEST_KEY);

    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toMatchObject({
      type: "text",
      text: "<html><body>Hello</body></html>",
    });
  });

  it("returns content with Markdown mime type on a successful Markdown response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "# Hello",
      }),
    );

    const result = await scrapeUrl("https://example.com", "Markdown", TEST_KEY);

    expect(result.isError).toBeFalsy();
    expect(result.content[0]).toMatchObject({ type: "text", text: "# Hello" });
  });

  it("returns isError: true on a non-ok HTTP response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Unauthorized",
      }),
    );

    const result = await scrapeUrl("https://example.com", "HTML", TEST_KEY);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Unauthorized");
  });

  it("returns isError: true when fetch throws (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const result = await scrapeUrl("https://example.com", "HTML", TEST_KEY);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network failure");
  });

  it("sends the correct API key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", mockFetch);

    await scrapeUrl("https://example.com", "HTML", "my-secret-key");

    const calledHeaders = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(calledHeaders["X-API-KEY"]).toBe("my-secret-key");
  });

  it("includes parsed browserCommands in the request body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", mockFetch);

    const cmds = JSON.stringify([{ click: "#btn" }, { wait: 1000 }]);
    await scrapeUrl("https://example.com", "HTML", TEST_KEY, cmds);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      browserCommands: unknown[];
    };
    expect(sentBody.browserCommands).toEqual([{ click: "#btn" }, { wait: 1000 }]);
  });

  it("returns isError: true when browserCommands is not a JSON array", async () => {
    const result = await scrapeUrl(
      "https://example.com",
      "HTML",
      TEST_KEY,
      JSON.stringify({ click: "#btn" }), // object, not array
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Browser commands must be a JSON array");
  });

  it("returns isError: true when browserCommands is invalid JSON", async () => {
    const result = await scrapeUrl("https://example.com", "HTML", TEST_KEY, "not-json");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Invalid browser commands format");
  });

  it("ignores whitespace-only browserCommands", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", mockFetch);

    await scrapeUrl("https://example.com", "HTML", TEST_KEY, "   ");

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string) as {
      browserCommands?: unknown;
    };
    expect(sentBody.browserCommands).toBeUndefined();
  });
});
