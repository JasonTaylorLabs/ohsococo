<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# How work flows in this repo (dad.os lane)

- Work starts from a GitHub Issue with acceptance criteria. If the Issue is ambiguous, ask in the Issue instead of guessing.
- One Issue, one branch `task/<issue>-<slug>`, one git worktree under `~/Developer/worktrees/ohsococo/`. Never edit the main checkout.
- Open the PR against `dev`. Never push to `dev` or `main` directly. Only the owner merges `dev` into `main` (production).
- Before requesting merge, all of these pass locally and in CI: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
- A bug fix includes a test that failed before the fix. Do not delete or skip tests, or loosen a check, to make a PR pass.
- End-to-end tests run against the static export in `out/`, built with an empty `NEXT_PUBLIC_BASE_PATH`.
- Every PR into `dev` gets a preview at `https://jasontaylorlabs.github.io/ohsococo/pr-preview/pr-<number>/`. The stable dev build is at `/ohsococo/dev/`. Production is `/ohsococo/`. All three publish from the `gh-pages` branch; never edit that branch by hand.
