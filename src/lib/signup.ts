/**
 * Static-host friendly signup. Posts JSON to SUBSCRIBE_ENDPOINT below
 * (Formspree, Mailchimp, Zapier, Make, etc.) when configured. Without an
 * endpoint it falls back to a pre-filled email so no signup is lost.
 *
 * No imports: vitest has no `@/` alias, and the caller passes `site.email` in.
 */
// Keep this literal `process.env.NEXT_PUBLIC_…` read so Next inlines it into the client bundle.
export const SUBSCRIBE_ENDPOINT = process.env.NEXT_PUBLIC_SUBSCRIBE_ENDPOINT;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGE_INVALID = "Enter a valid email.";
export const MESSAGE_MAILTO = "Your email app should open with a ready-to-send note. Hit send and you're in.";
export const MESSAGE_SUCCESS = "You're on the list. Drop announcements coming your way.";
export const MESSAGE_FAILED = "Something went wrong. Try again.";

export function cleanEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(clean: string): boolean {
  return EMAIL_RE.test(clean);
}

export function signupMailto(clean: string, to: string): string {
  const subject = encodeURIComponent("Add me to the Oh So Coco drop list");
  const body = encodeURIComponent(`Please add ${clean} to the drop announcement list.`);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export type SignupStep =
  | { kind: "ignore" }
  | { kind: "invalid" }
  | { kind: "mailto"; email: string }
  | { kind: "post"; endpoint: string; email: string };

/**
 * What a submit should do, in the original order: clean, honeypot, validate, then
 * mailto when there is no endpoint (undefined or ""), otherwise POST.
 */
export function signupStep(
  rawEmail: string,
  honeypot: FormDataEntryValue | null,
  endpoint: string | undefined,
): SignupStep {
  const clean = cleanEmail(rawEmail);
  if (honeypot) return { kind: "ignore" }; // honeypot
  if (!isValidEmail(clean)) return { kind: "invalid" };
  if (!endpoint) return { kind: "mailto", email: clean };
  return { kind: "post", endpoint, email: clean };
}

/** POST the signup. True on a 2xx; false on any other status or if the request throws. */
export async function postSignup(endpoint: string, clean: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: clean, source: "ohsococo-landing" }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return true;
  } catch {
    return false;
  }
}
