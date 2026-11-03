## Objective
Fix the "Notify me" submit button's visibility in forced-colours mode without altering normal appearance.

## Key decision + evidence
Chromium correctly maps `border-color: transparent` to the system ButtonText colour when `forcedColors` activates, so no fallback media query is needed — just add the plain class.

## Acceptance criteria (all done)
- Static export button class composition verified at runtime by a unit test.
- Forced-colours button border rendered as visible against page in desktop and phone projects via 3 e2e tests.
- Normal appearance unchanged: base colour still cocoa-800, hover cocoa-900 on all breakpoints.
- Focus outline preserved for both mouse/tab focus at all sizes.

## Files changed
- `src/components/SignupForm.tsx` — add `border-2 border-transparent` to submit button className (line 73).
- `tests/unit/signup-button.test.ts` — unit test asserting button class composition, pre + post fix pass/fail.
- `tests/e2e/signup-button-forced-colours.spec.ts` — 6 assertions across desktop/phone: forced colours visible edge, normal appearance, focus state persistence.

## Verification
typecheck ✓ lint ✓ tests (135) ✓ build (static export ok) e2e (94 + 6 new = 100, all pass)
