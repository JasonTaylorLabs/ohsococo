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

The form posts JSON to `NEXT_PUBLIC_SUBSCRIBE_ENDPOINT` (Formspree, Mailchimp,
Zapier, Make, etc.) when that is set. Without it, submitting opens a pre-filled
email to the business address so no signup is lost. For GitHub Pages, set a
repository variable named `SUBSCRIBE_ENDPOINT` and the workflow passes it in.

## Deploy

The site is a static export (`output: "export"`) published to GitHub Pages by
`.github/workflows/deploy.yml` on every push to `main`:

https://jasontaylorlabs.github.io/ohsococo/

`NEXT_PUBLIC_BASE_PATH` is `/ohsococo` for the project-site URL. When a custom
domain is attached, clear it and update `site.url` in `src/content/site.ts`.

## Roadmap

See the PRD for V2 (menu, gallery, custom request form, CMS), V3 (paid preorder
drops), and V4 (online-paid quotes, admin).
