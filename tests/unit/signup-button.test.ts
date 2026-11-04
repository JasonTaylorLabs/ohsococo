import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const signupFormSource = readFileSync(path.join(root, "src/components/SignupForm.tsx"), "utf-8");

function submitButtonClasses() {
  const match = signupFormSource.match(/<button[\s\S]*?type="submit"[\s\S]*?className="([^"]*)"/);
  expect(match, "submit button className not found in SignupForm.tsx").not.toBeNull();
  return match![1];
}

describe("notify me button className (Issue #81)", () => {
  it('includes "border-2"', () => {
    expect(submitButtonClasses()).toMatch(/\bborder-2\b/);
  });

  it('includes "border-transparent"', () => {
    expect(submitButtonClasses()).toMatch(/\bborder-transparent\b/);
  });

  it("still includes h-14", () => {
    expect(submitButtonClasses()).toMatch(/\bh-14\b/);
  });

  it('includes "forced-colors:focus-visible:outline-offset-2"', () => {
    expect(submitButtonClasses()).toMatch(/(^|\s)forced-colors:focus-visible:outline-offset-2(\s|$)/);
  });
});
