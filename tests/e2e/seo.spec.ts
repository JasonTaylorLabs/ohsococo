import { expect, test } from "@playwright/test";
import { site } from "../../src/content/site";

const home = `${site.url.replace(/\/+$/, "")}/`;

function noDoubleSlash(url: string) {
  const withoutScheme = url.replace(/^https?:\/\//, "");
  expect(withoutScheme).not.toContain("//");
}

function collectLocs(sitemapText: string): string[] {
  const re = /<loc>(.*?)<\/loc>/g;
  const locs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(sitemapText)) !== null) {
    locs.push(match[1]);
  }
  return locs;
}

test("sitemap.xml: status 200, at least one <loc>, first equals home, no double slash in any loc", async ({ request }) => {
  const resp = await request.get("/sitemap.xml");
  expect(resp.status()).toBe(200);
  const text = await resp.text();
  const locs = collectLocs(text);
  expect(locs.length).toBeGreaterThan(0);
  expect(locs[0]).toBe(home);
  for (const loc of locs) {
    noDoubleSlash(loc);
  }
});

test("robots.txt Sitemap: line equals home sitemap.xml, no double slash", async ({ request }) => {
  const resp = await request.get("/robots.txt");
  expect(resp.status()).toBe(200);
  const text = await resp.text();
  const match = text.match(/^Sitemap:\s*(.+)$/m);
  expect(match).not.toBeNull();
  expect(match![1]).toBe(`${home}sitemap.xml`);
  noDoubleSlash(match![1]);
});

test("og:url meta tag equals home", async ({ page }) => {
  await page.goto("/");
  const el = page.locator("meta[property='og:url']");
  await expect(el).toHaveCount(1);
  await expect(el).toHaveAttribute("content", home);
});

test("JSON-LD url equals home, image equals home og.png, no double slash in url/image/logo", async ({ page }) => {
  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const bakeries = blocks.map((text) => JSON.parse(text)).filter((block) => block["@type"] === "Bakery");
  expect(bakeries).toHaveLength(1);
  const [json] = bakeries;
  expect(json.url).toBe(home);
  expect(json.image).toBe(`${home}og.png`);
  expect(json.logo).toBe(`${home}logo.svg`);
  for (const url of [json.url, json.image, json.logo]) noDoubleSlash(url);
});
