import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = join(__dirname, "../../src");
const fontsDir = join(src, "app/fonts");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe("fonts", () => {
  // next/font/google downloads from Google during the build, so the build fails when Google is unreachable.
  it("nothing loads fonts from Google", () => {
    const offenders = sourceFiles(src).filter((f) => readFileSync(f, "utf8").includes("next/font/google"));
    expect(offenders).toEqual([]);
  });

  it("every self-hosted font file is real WOFF2", () => {
    const files = readdirSync(fontsDir).filter((f) => f.endsWith(".woff2"));
    expect(files.length).toBe(2);
    for (const f of files) {
      expect(readFileSync(join(fontsDir, f)).subarray(0, 4).toString("latin1"), f).toBe("wOF2");
    }
  });
});
