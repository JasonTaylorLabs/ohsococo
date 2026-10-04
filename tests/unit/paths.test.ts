import { afterEach, describe, expect, it, vi } from "vitest";

async function loadAsset(base?: string) {
  vi.resetModules();
  if (base === undefined) vi.stubEnv("NEXT_PUBLIC_BASE_PATH", undefined as unknown as string);
  else vi.stubEnv("NEXT_PUBLIC_BASE_PATH", base);
  return (await import("../../src/lib/paths")).asset;
}

async function loadNotFoundPath(base?: string) {
  vi.resetModules();
  if (base === undefined) vi.stubEnv("NEXT_PUBLIC_BASE_PATH", undefined as unknown as string);
  else vi.stubEnv("NEXT_PUBLIC_BASE_PATH", base);
  return (await import("../../src/lib/paths")).subsiteNotFoundPath;
}

afterEach(() => vi.unstubAllEnvs());

describe("asset", () => {
  it("prefixes the base path", async () => {
    const asset = await loadAsset("/ohsococo");
    expect(asset("/logo.svg")).toBe("/ohsococo/logo.svg");
  });

  it("adds a leading slash when missing", async () => {
    const asset = await loadAsset("/ohsococo");
    expect(asset("logo.svg")).toBe("/ohsococo/logo.svg");
  });

  it("works with no base path", async () => {
    const asset = await loadAsset("");
    expect(asset("/logo.svg")).toBe("/logo.svg");
  });
});

describe("subsiteNotFoundPath", () => {
  describe("with base /ohsococo", () => {
    it("/ohsococo/dev/nope/ → /ohsococo/dev/404.html", async () => {
      const fn = await loadNotFoundPath("/ohsococo");
      expect(fn("/ohsococo/dev/nope/", "/ohsococo")).toBe("/ohsococo/dev/404.html");
    });

    it("/ohsococo/pr-preview/pr-17/a/b/ → /ohsococo/pr-preview/pr-17/404.html", async () => {
      const fn = await loadNotFoundPath("/ohsococo");
      expect(fn("/ohsococo/pr-preview/pr-17/a/b/", "/ohsococo")).toBe(
        "/ohsococo/pr-preview/pr-17/404.html",
      );
    });

    it("/ohsococo/nope/ → null", async () => {
      const fn = await loadNotFoundPath("/ohsococo");
      expect(fn("/ohsococo/nope/", "/ohsococo")).toBeNull();
    });

    it("/ohsococo/dev/404.html → null (loop guard)", async () => {
      const fn = await loadNotFoundPath("/ohsococo");
      expect(fn("/ohsococo/dev/404.html", "/ohsococo")).toBeNull();
    });

    it("/ohsococo/pr-preview/pr-17/404.html → null (loop guard)", async () => {
      const fn = await loadNotFoundPath("/ohsococo");
      expect(fn("/ohsococo/pr-preview/pr-17/404.html", "/ohsococo")).toBeNull();
    });

    it("/ohsococo/pr-preview/nope/ → null", async () => {
      const fn = await loadNotFoundPath("/ohsococo");
      expect(fn("/ohsococo/pr-preview/nope/", "/ohsococo")).toBeNull();
    });
  });

  describe("with base /ohsococo/dev (the dev build's own page)", () => {
    it("/ohsococo/dev/nope/ → null", async () => {
      const fn = await loadNotFoundPath("/ohsococo/dev");
      expect(fn("/ohsococo/dev/nope/", "/ohsococo/dev")).toBeNull();
    });
  });

  describe("with empty base", () => {
    it("/dev/nope/ → /dev/404.html", async () => {
      const fn = await loadNotFoundPath("");
      expect(fn("/dev/nope/", "")).toBe("/dev/404.html");
    });
  });
});
