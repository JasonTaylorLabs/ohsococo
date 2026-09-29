"use client";

import { useState } from "react";
import { site } from "@/content/site";

type Status = "idle" | "loading" | "done" | "error";

/**
 * Static-host friendly signup. Posts JSON to NEXT_PUBLIC_SUBSCRIBE_ENDPOINT
 * (Formspree, Mailchimp, Zapier, Make, etc.) when configured. Without an
 * endpoint it falls back to a pre-filled email so no signup is lost.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_SUBSCRIBE_ENDPOINT;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    const form = new FormData(e.currentTarget);
    if (form.get("website")) return; // honeypot
    if (!EMAIL_RE.test(clean)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }

    if (!ENDPOINT) {
      const subject = encodeURIComponent("Add me to the Oh So Coco drop list");
      const body = encodeURIComponent(`Please add ${clean} to the drop announcement list.`);
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
      setStatus("done");
      setMessage("Your email app should open with a ready-to-send note. Hit send and you're in.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: clean, source: "ohsococo-landing" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      setMessage("You're on the list. Drop announcements coming your way.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
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
