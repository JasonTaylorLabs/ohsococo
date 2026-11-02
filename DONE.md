- Changed `flex-1` to `sm:flex-1` in the email input's className in `src/components/SignupForm.tsx` so the input doesn't collapse to ~24px height below 640px viewport width (the phone bug).
- Added e2e test in `tests/e2e/landing.spec.ts` verifying input height matches button height at 320px, 390px, and 1280px viewports.

All checks pass: typecheck, lint, test, build, test:e2e.
