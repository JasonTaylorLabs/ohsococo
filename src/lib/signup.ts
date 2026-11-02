/**
 * Static-host friendly signup. Posts JSON to SUBSCRIBE_ENDPOINT below when
 * configured; the expected provider is Formspree (free plan), set up with the
 * spam settings in README.md "Email signup". Without an endpoint it falls back
 * to a pre-filled email so no signup is lost.
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

/**
 * Who the signup email goes to, for the fine print under the form: "Formspree" for
 * formspree.io (or a subdomain), otherwise the endpoint's hostname. Null when there is
 * no endpoint or it is not a URL with a host.
 */
export function signupProviderName(endpoint: string | undefined): string | null {
  if (!endpoint) return null;
  let host: string;
  try {
    host = new URL(endpoint).hostname;
  } catch {
    return null;
  }
  if (host === "formspree.io" || host.endsWith(".formspree.io")) return "Formspree";
  return host || null; // e.g. "mailto:a@b" parses but has no host
}

export type SignupStatus = "idle" | "loading" | "done" | "error";

/** The form state a submit changes, plus how to open the mailto href. */
export type SignupUi = {
  setStatus: (status: SignupStatus) => void;
  setMessage: (message: string) => void;
  setEmail: (email: string) => void;
  navigate: (href: string) => void;
};

/** Everything a form submit does after preventDefault, in order, driving the form through `ui`. */
export async function submitSignup(
  rawEmail: string,
  honeypot: FormDataEntryValue | null,
  endpoint: string | undefined,
  to: string,
  ui: SignupUi,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const step = signupStep(rawEmail, honeypot, endpoint);
  if (step.kind === "ignore") return; // honeypot
  if (step.kind === "invalid") {
    ui.setStatus("error");
    ui.setMessage(MESSAGE_INVALID);
    return;
  }
  if (step.kind === "mailto") {
    ui.navigate(signupMailto(step.email, to));
    ui.setStatus("done");
    ui.setMessage(MESSAGE_MAILTO);
    return;
  }

  ui.setStatus("loading");
  if (await postSignup(step.endpoint, step.email, fetchImpl)) {
    ui.setStatus("done");
    ui.setMessage(MESSAGE_SUCCESS);
    ui.setEmail("");
  } else {
    ui.setStatus("error");
    ui.setMessage(MESSAGE_FAILED);
  }
}
