import { expect, test } from "@playwright/test";
import { gallery, site } from "../../src/content/site";

test("landing page renders the brand and tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Oh So Coco/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.tagline);
});

test("every section a nav link points to exists", async ({ page }) => {
  await page.goto("/");
  for (const id of ["treats", "gallery", "occasions", "how", "faq"]) {
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

test("gallery shows a tile per content item, in order, between the menu and occasions", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#gallery");
  await expect(section.getByRole("heading", { level: 2, name: "Gallery" })).toBeVisible();

  const captions = section.locator("figcaption");
  await expect(captions).toHaveText(gallery.map((g) => g.caption));

  const order = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id));
  expect(order.indexOf("gallery")).toBe(order.indexOf("treats") + 1);
  expect(order.indexOf("occasions")).toBe(order.indexOf("gallery") + 1);

  await expect(section.getByRole("link", { name: "See more on Instagram" })).toHaveAttribute(
    "href",
    site.instagram.url,
  );
  await expect(page.locator('header nav a[href="#gallery"]')).toHaveCount(1);
});

test("gallery grid is 2 columns on phones and 4 on desktop", async ({ page }, testInfo) => {
  await page.goto("/");
  const columns = await page
    .locator("#gallery ul")
    .evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "phone" ? 2 : 4);
});
