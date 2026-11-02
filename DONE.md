## Changes (Issue #53)

Three class-only fixes in `src/components/SignupForm.tsx` to meet WCAG AA contrast requirements:

1. **Error text** (`text-pink-600` → `text-pink-700`): 4.83:1 on cream-50, up from 4.14:1 (fails AA).
2. **Placeholder** (`placeholder:text-cocoa-600/60` → `placeholder:text-cocoa-600`): full opacity, 4.64:1 on white, up from ~2.3:1 (fails AA).
3. **Label** (`sr-only` → `basis-full px-6 text-left text-sm font-semibold text-cocoa-800`): visible above the email field so the "Email address" label never disappears while typing (WCAG 3.3.2).

No CSS tokens, markup order, or test files were modified — only added: `contrast()` helper in unit tests, a new e2e test across desktop/phone viewports, and a standalone placeholder colour assertion.
