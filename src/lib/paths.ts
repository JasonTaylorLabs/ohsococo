/** Prefix a public asset path with the deploy base path (e.g. "/ohsococo" on GitHub Pages). */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Return a sub-site's own `404.html` path, or `null` when the pathname doesn't match any
 * known sub-site prefix. Also returns `null` when `pathname` already ends in `/404.html` so
 * that a missing sub-site page cannot trigger a redirect loop.
 */
export function subsiteNotFoundPath(
  pathname: string,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
): string | null {
  // Loop guard
  if (pathname.endsWith("/404.html")) return null;

  const noBase = basePath === "";
  // Strip basePath for matching so we work relative to the build's own base.
  const rest = noBase ? pathname : pathname.slice(basePath.length);

  // dev/ — must not be something like "developer/"
  if (rest.startsWith("/dev/") || rest === "/dev") return `${basePath}/dev/404.html`;

  // pr-preview/pr-<digits>/
  const prMatch = rest.match(/^\/pr-preview\/pr-(\d+)\/?/);
  if (prMatch) {
    const digits = prMatch[1];
    return `${basePath}/pr-preview/pr-${digits}/404.html`;
  }

  return null;
}
