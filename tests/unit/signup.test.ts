import { describe, expect, it, vi } from "vitest";
import { site } from "../../src/content/site";
import {
  MESSAGE_FAILED,
  MESSAGE_INVALID,
  MESSAGE_MAILTO,
  MESSAGE_SUCCESS,
  postSignup,
  signupMailto,
  signupProviderName,
  signupStep,
  submitSignup,
  type SignupUi,
} from "../../src/lib/signup";

const ENDPOINT = "https://example.invalid/subscribe";

function fetchReturning(status = 200) {
  return vi.fn<typeof fetch>(async () => new Response(null, { status }));
}

// The same dispatch SignupForm's onSubmit does: only a `post` step reaches fetch.
async function submit(raw: string, honeypot: FormDataEntryValue | null, endpoint: string | undefined, fetchImpl: typeof fetch) {
  const step = signupStep(raw, honeypot, endpoint);
  if (step.kind === "post") await postSignup(step.endpoint, step.email, fetchImpl);
  return step;
}

describe("signupStep", () => {
  it("honeypot filled sends nothing", async () => {
    const fetchMock = fetchReturning();
    expect(await submit("test@example.com", "http://spam.example", ENDPOINT, fetchMock)).toEqual({ kind: "ignore" });
    expect(await submit("not-an-email", "x", ENDPOINT, fetchMock)).toEqual({ kind: "ignore" });
    expect(await submit("test@example.com", "x", undefined, fetchMock)).toEqual({ kind: "ignore" });
    expect(await submit("test@example.com", new File([], "x"), ENDPOINT, fetchMock)).toEqual({ kind: "ignore" });
    expect(fetchMock).not.toHaveBeenCalled();
    // An empty or missing honeypot is a real person.
    expect(signupStep("test@example.com", "", ENDPOINT).kind).toBe("post");
    expect(signupStep("test@example.com", null, ENDPOINT).kind).toBe("post");
  });

  it('invalid email shows "Enter a valid email."', () => {
    for (const raw of ["not-an-email", "", "   ", "a@b", "a b@c.de", "@example.com", "a@@example.com"]) {
      expect(signupStep(raw, null, ENDPOINT)).toEqual({ kind: "invalid" });
    }
    expect(MESSAGE_INVALID).toBe("Enter a valid email.");
  });

  it("no endpoint builds a mailto with the trimmed lowercased email", () => {
    const step = signupStep("  Test@Example.COM  ", null, undefined);
    expect(step).toEqual({ kind: "mailto", email: "test@example.com" });
    expect(signupMailto("test@example.com", site.email)).toBe(
      `mailto:${site.email}?subject=Add%20me%20to%20the%20Oh%20So%20Coco%20drop%20list&body=Please%20add%20test%40example.com%20to%20the%20drop%20announcement%20list.`,
    );
    expect(MESSAGE_MAILTO).toBe("Your email app should open with a ready-to-send note. Hit send and you're in.");
  });

  it("empty-string endpoint is treated as no endpoint", () => {
    expect(signupStep("  Test@Example.COM  ", null, "")).toEqual({ kind: "mailto", email: "test@example.com" });
  });

  it("an endpoint posts the trimmed lowercased email", () => {
    expect(signupStep("  Test@Example.COM  ", null, ENDPOINT)).toEqual({
      kind: "post",
      endpoint: ENDPOINT,
      email: "test@example.com",
    });
  });
});

describe("postSignup", () => {
  it('2xx POSTs exactly {email, source: "ohsococo-landing"} with JSON content-type', async () => {
    const fetchMock = fetchReturning(201);
    expect(await postSignup(ENDPOINT, "test@example.com", fetchMock)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "content-type": "application/json", accept: "application/json" });
    expect(init?.body).toBe('{"email":"test@example.com","source":"ohsococo-landing"}');
  });

  it('non-2xx shows "Something went wrong. Try again."', async () => {
    for (const status of [300, 400, 404, 500, 503]) {
      expect(await postSignup(ENDPOINT, "test@example.com", fetchReturning(status))).toBe(false);
    }
    expect(MESSAGE_FAILED).toBe("Something went wrong. Try again.");
  });

  it('fetch throwing shows "Something went wrong. Try again."', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await postSignup(ENDPOINT, "test@example.com", fetchMock)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(MESSAGE_FAILED).toBe("Something went wrong. Try again.");
  });

  it(`success message is "You're on the list. Drop announcements coming your way."`, () => {
    expect(MESSAGE_SUCCESS).toBe("You're on the list. Drop announcements coming your way.");
  });
});

describe("signupProviderName", () => {
  it("no endpoint names nobody", () => {
    expect(signupProviderName(undefined)).toBeNull();
    expect(signupProviderName("")).toBeNull();
  });

  it("an endpoint that is not a URL names nobody", () => {
    expect(signupProviderName("not a url")).toBeNull();
    expect(signupProviderName("formspree.io/f/abc")).toBeNull();
    expect(signupProviderName("mailto:hello@example.com")).toBeNull();
  });

  it('formspree.io is "Formspree"', () => {
    expect(signupProviderName("https://formspree.io/f/abc")).toBe("Formspree");
  });

  it('a *.formspree.io host is "Formspree"', () => {
    expect(signupProviderName("https://api.formspree.io/f/abc")).toBe("Formspree");
  });

  it("any other endpoint is named by its hostname", () => {
    expect(signupProviderName(ENDPOINT)).toBe("example.invalid");
    expect(signupProviderName("https://hooks.zapier.com/hooks/catch/1/abc/")).toBe("hooks.zapier.com");
    // Look-alikes are not Formspree.
    expect(signupProviderName("https://notformspree.io/f/abc")).toBe("notformspree.io");
    expect(signupProviderName("https://formspree.io.example.com/f/abc")).toBe("formspree.io.example.com");
  });
});

describe("submitSignup", () => {
  // Every UI call, in order, as [name, arg].
  function recordingUi() {
    const calls: [string, string][] = [];
    const ui: SignupUi = {
      setStatus: (status) => calls.push(["setStatus", status]),
      setMessage: (message) => calls.push(["setMessage", message]),
      setEmail: (email) => calls.push(["setEmail", email]),
      navigate: (href) => calls.push(["navigate", href]),
    };
    return { calls, ui };
  }

  it("honeypot filled makes no UI calls and no request", async () => {
    const { calls, ui } = recordingUi();
    const fetchMock = fetchReturning();
    await submitSignup("test@example.com", "http://spam.example", ENDPOINT, site.email, ui, fetchMock);
    expect(calls).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('invalid email sets error then "Enter a valid email."', async () => {
    const { calls, ui } = recordingUi();
    const fetchMock = fetchReturning();
    await submitSignup("not-an-email", null, ENDPOINT, site.email, ui, fetchMock);
    expect(calls).toEqual([
      ["setStatus", "error"],
      ["setMessage", MESSAGE_INVALID],
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no endpoint navigates to the mailto href, then shows the email-app message", async () => {
    const { calls, ui } = recordingUi();
    const fetchMock = fetchReturning();
    await submitSignup("  Test@Example.COM  ", null, undefined, site.email, ui, fetchMock);
    expect(calls).toEqual([
      [
        "navigate",
        `mailto:${site.email}?subject=Add%20me%20to%20the%20Oh%20So%20Coco%20drop%20list&body=Please%20add%20test%40example.com%20to%20the%20drop%20announcement%20list.`,
      ],
      ["setStatus", "done"],
      ["setMessage", MESSAGE_MAILTO],
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("post sets loading before fetching", async () => {
    const { calls, ui } = recordingUi();
    let callsAtFetch: [string, string][] | undefined;
    const fetchMock = vi.fn<typeof fetch>(async () => {
      callsAtFetch = [...calls];
      return new Response(null, { status: 200 });
    });
    await submitSignup("test@example.com", null, ENDPOINT, site.email, ui, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callsAtFetch).toEqual([["setStatus", "loading"]]);
  });

  it("post sends the trimmed lowercased email, not the raw input", async () => {
    const { ui } = recordingUi();
    const fetchMock = fetchReturning(200);
    await submitSignup("  Test@Example.COM  ", null, ENDPOINT, site.email, ui, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init?.body).toBe('{"email":"test@example.com","source":"ohsococo-landing"}');
  });

  it("2xx shows the success message and clears the input", async () => {
    const { calls, ui } = recordingUi();
    await submitSignup("test@example.com", null, ENDPOINT, site.email, ui, fetchReturning(200));
    expect(calls).toEqual([
      ["setStatus", "loading"],
      ["setStatus", "done"],
      ["setMessage", MESSAGE_SUCCESS],
      ["setEmail", ""],
    ]);
  });

  it("non-2xx shows the failure message and keeps the input", async () => {
    const { calls, ui } = recordingUi();
    await submitSignup("test@example.com", null, ENDPOINT, site.email, ui, fetchReturning(500));
    expect(calls).toEqual([
      ["setStatus", "loading"],
      ["setStatus", "error"],
      ["setMessage", MESSAGE_FAILED],
    ]);
  });

  it("fetch throwing shows the failure message and keeps the input", async () => {
    const { calls, ui } = recordingUi();
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    await submitSignup("test@example.com", null, ENDPOINT, site.email, ui, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      ["setStatus", "loading"],
      ["setStatus", "error"],
      ["setMessage", MESSAGE_FAILED],
    ]);
  });
});
