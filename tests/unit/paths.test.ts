import { afterEach, describe, expect, it, vi } from "vitest";

async function loadAsset(base?: string) {
  vi.resetModules();
  if (base === undefined) vi.stubEnv("NEXT_PUBLIC_BASE_PATH", undefined as unknown as string);
  else vi.stubEnv("NEXT_PUBLIC_BASE_PATH", base);
  return (await import("../../src/lib/paths")).asset;
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
