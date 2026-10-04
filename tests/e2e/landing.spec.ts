import { expect, test } from "@playwright/test";
import { gallery, site } from "../../src/content/site";

test("landing page renders the brand and tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Oh So Coco/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.tagline);
});

test("every section a nav link points to exists", async ({ page }) => {
  await page.goto("/");
  const ids = ["treats", ...(gallery.length > 0 ? ["gallery"] : []), "occasions", "how", "faq"];
  for (const id of ids) {
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

test("pressing Tab focuses the skip-to-content link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const link = page.getByRole("link", { name: "Skip to content" });
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute("href", /#top$/);
});

test("order button and drop badge use an AA-contrast pink background", async ({ page }) => {
  await page.goto("/");
  const orderButton = page.getByRole("link", { name: "Order on Instagram" }).first();
  await expect(orderButton).toHaveCSS("background-color", "rgb(196, 61, 112)");

  const badge = page.getByText(site.currentDrop.label);
  await expect(badge).toHaveCSS("background-color", "rgb(196, 61, 112)");
});

test("order button hover state uses a darker AA-contrast pink background", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "phone", "no hover on touch devices");
  await page.goto("/");
  const orderButton = page.getByRole("link", { name: "Order on Instagram" }).first();
  await orderButton.hover();
  await expect(orderButton).toHaveCSS("background-color", "rgb(168, 50, 93)");
});

test("no console errors or failed requests on load", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

test("an empty gallery list hides the section and its nav link", async ({ page }) => {
  test.skip(gallery.length > 0, "gallery has items");
  await page.goto("/");
  await expect(page.locator("#gallery")).toHaveCount(0);
  await expect(page.locator('header nav a[href="#gallery"]')).toHaveCount(0);
});

test("gallery shows a tile per content item, in order, between the menu and occasions", async ({ page }) => {
  test.skip(gallery.length === 0, "gallery is empty");
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
  test.skip(gallery.length === 0, "gallery is empty");
  await page.goto("/");
  const columns = await page
    .locator("#gallery ul")
    .evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name === "phone" ? 2 : 4);
});

test("every gallery photo loads", async ({ page }) => {
  const photos = gallery.filter((g) => g.image);
  test.skip(photos.length === 0, "no gallery photos yet");
  await page.goto("/");
  const images = page.locator("#gallery img");
  await expect(images).toHaveCount(photos.length);
  // Photos are lazy and below the fold, so scroll each into view before checking it decoded.
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
});
