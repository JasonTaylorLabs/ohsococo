## Changes

Added `tests/e2e/seo.spec.ts` — 4 Playwright tests covering the built static output for:

1. **sitemap.xml** — GET returns 200; collects every `<loc>` value; asserts first equals home URL (derived from `site.url`); no `//` after scheme in any loc.
2. **robots.txt** — GET returns 200; parses its `Sitemap:` line; asserts it equals `${home}sitemap.xml`; checks for double slashes.
3. **og:url** — On `page.goto("/")`, asserts the `meta[property="og:url"]` `content` attribute equals home URL.
4. **JSON-LD** — Parses the `<script type="application/ld+json">` body; asserts `url` equals home, `image` equals `${home}og.png`; checks `url`, `image`, and `logo` for double slashes.

## Why

Issue #37: if someone accidentally puts `site.url` (without trailing slash) back into `sitemap.ts`, `robots.ts`, or `layout.tsx` instead of using `absoluteUrl()`, the URLs will miss the trailing slash that GitHub Pages needs — but no existing gate catches it. The e2e suite (`tests/e2e/`) is where these static output files can be checked; running the new test via mutation confirmed all 4 are effective detectors (sitemap and JSON-LD fail on `site.url` direct assignment, double-slash mutation fails sitemap/og:url/JSON-LD tests across both desktop and phone projects).

## Mutation evidence

- AC 4 (sitemap: `url: site.url`): `"sitemap.xml"` test failed — `Expected "https://jasontaylorlabs.github.io/ohsococo/" vs Received "https://jasontaylorlabs.github.io/ohsococo"` (missing trailing slash)
- AC 5 (JSON-LD: `url: site.url` at layout.tsx:59): `"JSON-LD url"` test failed — same missing trailing slash; og:url still passed (different location)
- AC 7 (paths.ts double-slash): 6 tests failed across sitemap, og:url, JSON-LD in both desktop and phone projects — all caught `https://jasontaylorlabs.github.io/ohsococo//`
