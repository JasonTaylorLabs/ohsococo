import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function violations(page: Page) {
  const builder = new AxeBuilder({ page });
  const results = await builder.withTags(WCAG_TAGS).analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target.join(", ")),
  }));
}

test("accessibility: / loaded", async ({ page }) => {
  await page.goto("/");
  expect(await violations(page)).toEqual([]);
});

test("accessibility: / with validation error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter a valid email." })).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test("accessibility: / with confirmation message", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByRole("status").filter({ hasText: /\S/ })).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test("accessibility: /does-not-exist/ (404)", async ({ page }) => {
  const response = await page.goto("/does-not-exist/");
  expect(response?.status()).toBe(404);
  expect(await violations(page)).toEqual([]);
});
