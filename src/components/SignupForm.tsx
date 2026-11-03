"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { MESSAGE_INVALID, SUBSCRIBE_ENDPOINT, submitSignup, type SignupStatus } from "@/lib/signup";

/** Drop-list signup form; the submission rules (endpoint, honeypot, validation, mailto fallback) live in `@/lib/signup`. */
export function SignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [message, setMessage] = useState("");
  // Keys the error paragraph so a repeated error is a fresh alert that screen readers announce again.
  const [attempt, setAttempt] = useState(0);
  const doneRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status === "done") doneRef.current?.focus();
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttempt((n) => n + 1);
    await submitSignup(email, new FormData(e.currentTarget).get("website"), SUBSCRIBE_ENDPOINT, site.email, {
      setStatus,
      setMessage,
      setEmail,
      navigate: (href) => {
        window.location.href = href;
      },
    });
  }

  if (status === "done") {
    return (
      <p ref={doneRef} tabIndex={-1} role="status" className="rounded-2xl bg-cream-100 px-5 py-4 text-cocoa-800 font-semibold">
        🤎 {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" noValidate>
      <label className="basis-full px-6 text-left text-sm font-semibold text-cocoa-800" htmlFor="signup-email">
        Email address
      </label>
      <input
        id="signup-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={status === "error" && message === MESSAGE_INVALID ? true : undefined}
        aria-describedby={status === "error" ? "signup-error" : undefined}
        className="h-14 sm:flex-1 rounded-full border-2 border-cocoa-200 bg-white px-6 text-base text-cocoa-900 placeholder:text-cocoa-600 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/20"
      />
      {/* Honeypot field, hidden from people, filled by bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-14 rounded-full bg-cocoa-800 px-8 text-base font-bold text-cream-50 shadow-soft transition hover:bg-cocoa-900 disabled:opacity-60"
      >
        {status === "loading" ? "Adding…" : "Notify me"}
      </button>
      <p
        key={attempt}
        id="signup-error"
        role="alert"
        className="min-h-5 basis-full text-sm font-semibold text-pink-700"
      >
        {status === "error" ? message : ""}
      </p>
    </form>
  );
}
