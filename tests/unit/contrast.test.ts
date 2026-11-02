import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const globalsCss = readFileSync(path.join(root, "src/app/globals.css"), "utf-8");
const instagramButtonSource = readFileSync(path.join(root, "src/components/InstagramButton.tsx"), "utf-8");
const pageSource = readFileSync(path.join(root, "src/app/page.tsx"), "utf-8");
const layoutSource = readFileSync(path.join(root, "src/app/layout.tsx"), "utf-8");
const signupFormSource = readFileSync(path.join(root, "src/components/SignupForm.tsx"), "utf-8");

function readToken(name: string): string {
  const match = globalsCss.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Token --color-${name} not found in globals.css`);
  return match[1];
}

function toLinear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return 0.2126 * toLinear(channels[0]) + 0.7152 * toLinear(channels[1]) + 0.0722 * toLinear(channels[2]);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG 2.x relative luminance / contrast ratio formulas.
function contrastWithWhite(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (1.0 + 0.05) / (luminance + 0.05);
}

describe("pink token contrast against white text (WCAG AA, Issue #9)", () => {
  it("keeps pink-500 and pink-600 hex values unchanged", () => {
    expect(readToken("pink-500")).toBe("#e85d8a");
    expect(readToken("pink-600")).toBe("#d4467a");
  });

  it("adds new, darker tokens that meet 4.5:1 with white", () => {
    expect(contrastWithWhite(readToken("pink-700"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastWithWhite(readToken("pink-800"))).toBeGreaterThanOrEqual(4.5);
  });

  it("uses a hover shade distinct from (and darker than) pink-600, which still fails AA", () => {
    expect(contrastWithWhite(readToken("pink-600"))).toBeLessThan(4.5);
    expect(readToken("pink-800")).not.toBe(readToken("pink-600"));
  });

  it("InstagramButton's primary variant uses the new AA-passing shades, not pink-500/pink-600", () => {
    const primaryStyles = instagramButtonSource.match(/variant === "primary"\s*\?\s*"([^"]+)"/)?.[1] ?? "";
    expect(primaryStyles).toMatch(/\bbg-pink-700\b/);
    expect(primaryStyles).toMatch(/\bhover:bg-pink-800\b/);
    expect(primaryStyles).not.toMatch(/\bbg-pink-500\b/);
    expect(primaryStyles).not.toMatch(/\bhover:bg-pink-600\b/);
  });

  it("the current-drop badge uses the same AA-passing shade as the button's default state", () => {
    const badgeMatch = pageSource.match(/rounded-full bg-pink-(\d+) px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/);
    expect(badgeMatch?.[1]).toBe("700");
  });
});

describe("skip-to-content link contrast (WCAG AA, Issue #13)", () => {
  it("uses the AA-passing pink-700 for its focus background", () => {
    const skipLinkClass = layoutSource.match(/sr-only[^>]*focus:bg-pink-(\d+)/)?.[1];
    expect(skipLinkClass).toBe("700");
  });
});

describe("signup form contrast (WCAG AA, Issue #53)", () => {
  it("error paragraph uses text-pink-700, not text-pink-600", () => {
    const alertP = signupFormSource.match(/<p[^>]*role="alert"[^>]*className="([^"]*)"/);
    expect(alertP).not.toBeNull();
    const classes = alertP![1];
    expect(classes).toMatch(/\btext-pink-700\b/);
    expect(classes).not.toMatch(/\btext-pink-600\b/);
  });

  it("pink-700 on cream-50 meets 4.5:1", () => {
    const ratio = contrast(readToken("pink-700"), readToken("cream-50"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('input placeholder uses placeholder:text-cocoa-600 with no opacity modifier', () => {
    const inputMatch = signupFormSource.match(/<input[\s\S]*?className="([^"]*)"/);
    expect(inputMatch).not.toBeNull();
    const classes = inputMatch![1];
    expect(classes).toMatch(/placeholder:text-cocoa-600(?![\/\w-])/);
  });

  it("cocoa-600 on white input meets 4.5:1", () => {
    const ratio = contrast(readToken("cocoa-600"), "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('label htmlFor="signup-email" does not contain sr-only', () => {
    const labelTag = signupFormSource.match(/<label[\s\S]*?htmlFor="signup-email"[\s\S]*?>/);
    expect(labelTag).not.toBeNull();
    expect(labelTag![0]).not.toMatch(/\bsr-only\b/);
  });
});
