## Task 37: Fix sitemap <loc>, og:url and JSON-LD url for home page trailing slash

**Status**: In progress

- [ ] Update `absoluteUrl()` in `src/lib/paths.ts` to return slashed home URL
- [ ] Update tests in `tests/unit/paths.test.ts`
- [ ] Update `src/app/layout.tsx` to use `absoluteUrl("/")` for openGraph.url and JSON-LD url
- [ ] Run all verification commands
