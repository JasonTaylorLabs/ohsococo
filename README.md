# Oh So Coco — website

V1 landing page for Oh So Coco, a custom chocolate-covered treats business in
Orange County, NY. Built with Next.js 16, TypeScript, and Tailwind CSS 4.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Edit content

Everything on the page comes from one file: `src/content/site.ts`.

- `site` — name, tagline, email, Instagram links, service area, and the
  **current drop** banner (`currentDrop.enabled` hides it).
- `productLines` — the treat tiles. Add `image: "/products/<file>"` once real
  photos are in `public/products/`.
- `occasions`, `howToOrder`, `faq` — the remaining sections.

Lines marked `CONFIRM` were not visible on the public Instagram profile and
should be checked with the owner before launch.

## Email signup

The form posts JSON to `NEXT_PUBLIC_SUBSCRIBE_ENDPOINT` when that is set. Without
it, submitting opens a pre-filled email to the business address so no signup is
lost. For GitHub Pages, set a repository variable named `SUBSCRIBE_ENDPOINT` and
the workflow passes it in.

The expected provider is **Formspree (free plan)**: it accepts the JSON `fetch`
the form already sends. The endpoint is public by design and a static site cannot
rate-limit, so spam protection has to be switched on at Formspree. Setup checklist:

- **Create a form.** Its endpoint is `https://formspree.io/f/<form-id>`; set it as
  the repo variable `SUBSCRIBE_ENDPOINT`. This is what turns online signups on.
- **Spam filtering (Formshield): on.** Formspree screens every submission
  server-side, which the browser-only honeypot cannot do against a script.
- **Restrict to domain: on**, set to the domain in `site.url`
  (`src/content/site.ts`), today `jasontaylorlabs.github.io`. Submissions from
  other sites go to spam. It is a project-level setting, so keep this form in its
  own Formspree project. Change it when the custom domain lands.
- **reCAPTCHA: off.** Formspree's default reCAPTCHA redirects to a Formspree
  page, which a `fetch` submit cannot follow, so every real signup would show
  "Something went wrong."
- **Nothing that emails the submitted address:** no auto-reply or confirmation
  email, and no plugin that auto-adds submissions to a mailing list (Mailchimp,
  MailerLite, etc.) unless that list has **double opt-in** on. Without them,
  Formspree only emails each submission to the business and nobody gets mail
  until the owner adds them, so a fake signup cannot make the site email a
  stranger. When adding people by hand, use a list with double opt-in or confirm
  each address first.
- **Free quota: 50 submissions a month.** Past it, the form still works for
  visitors but Formspree holds new submissions in an "Over Limit" folder, without
  emailing them or running plugins, until you reprocess them from the dashboard
  once there is room; so a flood costs at most a month's quota, never money.
- **What this does not stop:** a script that forges the `Referer` header (what
  the domain check reads) still gets through, so Formshield and the 50/month cap
  are the backstop. The site's referrer policy must keep sending its origin to
  formspree.io (the browser default does), or real signups land in spam.

Any other provider must offer server-side spam filtering, and double opt-in (or
no automatic mailing), on a free plan before it replaces Formspree. The fine print
under the form names whoever receives the email (`signupProviderName` in
`src/lib/signup.ts`: "Formspree", otherwise the endpoint's hostname); it must
still name the new provider.

## Deploy

The site is a static export (`output: "export"`) published to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`:

https://jasontaylorlabs.github.io/ohsococo/

`NEXT_PUBLIC_BASE_PATH` is `/ohsococo` for the project-site URL. When a custom
domain is attached, clear it and update `site.url` in `src/content/site.ts`.

## Roadmap

See the PRD for V2 (menu, gallery, custom request form, CMS), V3 (paid preorder
drops), and V4 (online-paid quotes, admin).
