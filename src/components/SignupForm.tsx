"use client";

import { useState } from "react";
import { site } from "@/content/site";
import {
  MESSAGE_FAILED,
  MESSAGE_INVALID,
  MESSAGE_MAILTO,
  MESSAGE_SUCCESS,
  SUBSCRIBE_ENDPOINT,
  postSignup,
  signupMailto,
  signupStep,
} from "@/lib/signup";

type Status = "idle" | "loading" | "done" | "error";

/** Drop-list signup form; the submission rules (endpoint, honeypot, validation, mailto fallback) live in `@/lib/signup`. */
export function SignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const show = (next: Status, text: string) => {
    setStatus(next);
    setMessage(text);
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const step = signupStep(email, new FormData(e.currentTarget).get("website"), SUBSCRIBE_ENDPOINT);
    if (step.kind === "ignore") return; // honeypot
    if (step.kind === "invalid") return show("error", MESSAGE_INVALID);
    if (step.kind === "mailto") {
      window.location.href = signupMailto(step.email, site.email);
      return show("done", MESSAGE_MAILTO);
    }

    setStatus("loading");
    if (await postSignup(step.endpoint, step.email)) {
      show("done", MESSAGE_SUCCESS);
      setEmail("");
    } else {
      show("error", MESSAGE_FAILED);
    }
  }

  if (status === "done") {
    return (
      <p role="status" className="rounded-2xl bg-cream-100 px-5 py-4 text-cocoa-800 font-semibold">
        🤎 {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
      <label className="sr-only" htmlFor="signup-email">
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
        className="h-14 flex-1 rounded-full border-2 border-cocoa-200 bg-white px-6 text-base text-cocoa-900 placeholder:text-cocoa-600/60 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/20"
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
      {status === "error" && (
        <p role="alert" className="basis-full text-sm font-semibold text-pink-600">
          {message}
        </p>
      )}
    </form>
  );
}
