/** Deploy base path (e.g. "/ohsococo" on GitHub Pages), read once at build time. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Sub-site folders on the gh-pages branch. They must match `.github/workflows/deploy.yml`;
 * `tests/unit/deploy-layout.test.ts` fails when the two drift apart.
 */
export const SUBSITES = { dev: "dev", previewUmbrella: "pr-preview", previewPrefix: "pr-" } as const;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Prefix a public asset path with the deploy base path. */
export function asset(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Return a sub-site's own `404.html` path, or `null` when the pathname doesn't match any
 * known sub-site prefix. Also returns `null` when `pathname` already ends in `/404.html` so
 * that a missing sub-site page cannot trigger a redirect loop.
 */
export function subsiteNotFoundPath(pathname: string, basePath = BASE): string | null {
  // Loop guard
  if (pathname.endsWith("/404.html")) return null;

  // Match relative to the build's own base; a pathname outside it is never a sub-site.
  if (!pathname.startsWith(`${basePath}/`)) return null;
  const rest = pathname.slice(basePath.length);

  // dev/ — must not be something like "developer/"
  if (rest.startsWith(`/${SUBSITES.dev}/`)) return `${basePath}/${SUBSITES.dev}/404.html`;

  // pr-preview/pr-<digits>/ — the slash is required so "pr-17abc/" can't match pr-17
  const umbrella = escapeRegExp(SUBSITES.previewUmbrella);
  const prefix = escapeRegExp(SUBSITES.previewPrefix);
  const prMatch = rest.match(new RegExp(`^/${umbrella}/${prefix}(\\d+)/`));
  if (prMatch) {
    const digits = prMatch[1];
    return `${basePath}/${SUBSITES.previewUmbrella}/${SUBSITES.previewPrefix}${digits}/404.html`;
  }

  return null;
}
