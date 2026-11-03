import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const signupFormSource = readFileSync(path.join(root, "src/components/SignupForm.tsx"), "utf-8");

describe("notify me button className (Issue #81)", () => {
  const match = signupFormSource.match(/<button[\s\S]*?type="submit"[\s\S]*?className="([^"]*)"/);
  it("found the submit button className", () => {
    expect(match).not.toBeNull();
  });

  const classes = match![1];

  it('includes "border-2"', () => {
    expect(classes).toMatch(/\bborder-2\b/);
  });

  it('includes "border-transparent"', () => {
    expect(classes).toMatch(/\bborder-transparent\b/);
  });

  it("still includes h-14", () => {
    expect(classes).toMatch(/\bh-14\b/);
  });
});
