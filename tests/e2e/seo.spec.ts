import { expect, test } from "@playwright/test";
import { site } from "../../src/content/site";

const home = `${site.url.replace(/\/+$/, "")}/`;

function noDoubleSlash(url: string) {
  const withoutScheme = url.replace(/^https?:\/\//, "");
  expect(withoutScheme).not.toContain("//");
}

async function collectLocs(sitemapText: string): Promise<string[]> {
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
  const locs = await collectLocs(text);
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
  const script = page.locator('script[type="application/ld+json"]');
  await expect(script.first()).toHaveCount(1);
  const json = JSON.parse(await innerText(script.first()));
  expect(json.url).toBe(home);
  expect(json.image).toBe(`${home}og.png`);
  noDoubleSlash(json.url);
  if (typeof json.image === "string") {
    noDoubleSlash(json.image);
  }
  if (Array.isArray(json.image)) {
    for (const img of json.image) {
      const imgUrl = typeof img === "string" ? img : (img as { url: string }).url;
      noDoubleSlash(imgUrl);
    }
  }
  noDoubleSlash(json.logo ?? "");
});

async function innerText(loc: import("@playwright/test").Locator): Promise<string> {
  return loc.evaluate((el) => (el as HTMLElement).innerText);
}
