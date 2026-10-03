import { expect, test } from "@playwright/test";
import { site } from "../../src/content/site";

test("landing page renders the brand and tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Oh So Coco/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.tagline);
});

test("every section a nav link points to exists", async ({ page }) => {
  await page.goto("/");
  for (const id of ["treats", "occasions", "how", "faq"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test("order buttons lead to Instagram", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href*="instagram.com"], a[href*="ig.me"]');
  expect(await links.count()).toBeGreaterThan(0);
});

test("signup rejects an invalid email", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter a valid email." })).toBeVisible();
});

test("no console errors or failed requests on load", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});
