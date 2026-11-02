## What changed

Added `sm:flex-wrap` to the `<form>` className in `src/components/SignupForm.tsx` (line 34) so the error message wraps to its own line below the email input and Notify me button at 640 px and wider. Added one e2e test in `tests/e2e/landing.spec.ts` that verifies at 640 px and 1280 px the input/button share a row, the alert sits below them on its own full-width line, and the button stays single-line.

## Why

Without flex-wrap the error paragraph (`basis-full`) stayed inline at `sm:` width, squeezing the email field to ~228 px and wrapping the Notify me button onto two lines. One class fixes it; input with `sm:flex-1` (basis 0) absorbs shrinking while the alert naturally gets a new line.
