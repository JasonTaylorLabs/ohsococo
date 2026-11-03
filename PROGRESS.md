# Progress: Issue 67 — Tie preview-cleanup.yml and production base path to SUBSITES

## In progress
- Adding 3 unit tests to `tests/unit/deploy-layout.test.ts`:
  1. ✅ Import `site` from `src/content/site` (already transitively imported via paths.ts)
  2. Test: `preview-cleanup.yml git ls-tree line contains SUBSITES.previewUmbrella`
  3. Test: `preview-cleanup.yml PR regex contains SUBSITES.previewUmbrella and SUBSITES.previewPrefix`
  4. Test: `new URL(site.url).pathname.replace(/\/+$/, "") === prodBase`

## Remaining
- Run proof-of-drift edits (temporarily break each test, verify failure, revert) per AC-2/AC-3
- Run all gate commands: typecheck, lint, test, build, test:e2e
- Write DONE.md when all pass
