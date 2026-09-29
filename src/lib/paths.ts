/** Prefix a public asset path with the deploy base path (e.g. "/ohsococo" on GitHub Pages). */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
