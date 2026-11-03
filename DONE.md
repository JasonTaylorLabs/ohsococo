## Changed

Added 3 unit tests to `tests/unit/deploy-layout.test.ts` that pin the production base path and the preview folder names from SUBSITES across all relevant artifacts:

1. **preview-cleanup.yml scan alignment** - Asserts `SUBSITES.previewUmbrella` appears in the `git ls-tree` path (`pr-preview/`)
2. **preview-cleanup.yml regex alignment** - Asserts `SUBSITES.previewUmbrella` + `SUBSITES.previewPrefix` appear in the PR-dir regex (`^pr-preview/pr-([0-9]+)$`)
3. **Production base URL alignment** - Asserts `site.url` pathname matches the `prodBase` from `deploy.yml`, with a comment explaining the bare custom domain case (empty base)

## Why

These tests catch drift between SUBSITES definitions and what the workflows / site config actually use. With proof-of-drift edits already verified during development, any future one-sided change in the YAML or site URL will fail `npm test`.
