## Task 37 complete

**Changed**: Three files to resolve the no-slash home URL issue on GitHub Pages:

1. **`src/lib/paths.ts`** — `absoluteUrl()` now returns `${site.url}/` when `path` is `""` or `"/"`, ensuring the home URL carries a trailing slash matching `trailingSlash: true`. Updated doc comment to explain why.
2. **`src/app/layout.tsx`** — Changed `openGraph.url` and JSON-LD `url` from `site.url` to `absoluteUrl("/")`.
3. **`tests/unit/paths.test.ts`** — Updated/pinned the home URL test to expect `https://jasontaylorlabs.github.io/ohsococo/`; added a new test confirming the dev base path still produces production URLs for home.

**Why**: GitHub Pages 301-redirects `.../ohsococo` → `.../ohsococo/`. Search engines and link previews now see the correct canonical address.
