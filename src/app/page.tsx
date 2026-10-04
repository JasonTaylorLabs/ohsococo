import Image from "next/image";
import { Gallery } from "@/components/Gallery";
import { InstagramButton } from "@/components/InstagramButton";
import { ProductTile } from "@/components/ProductTile";
import { SignupForm } from "@/components/SignupForm";
import { faq, gallery, howToOrder, occasions, productLines, site } from "@/content/site";
import { asset } from "@/lib/paths";

function Section({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 px-4 py-14 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {eyebrow && (
          <p className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-pink-500">{eyebrow}</p>
        )}
        <h2 className="mb-8 text-center text-3xl font-semibold text-cocoa-900 sm:mb-12 sm:text-4xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="sticky top-0 z-20 border-b border-cocoa-200/60 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <a href="#top" className="flex items-center gap-2.5">
            <Image src={asset("/logo.svg")} alt="" width={36} height={36} priority />
            <span className="font-display whitespace-nowrap text-xl font-semibold text-cocoa-900">{site.name}</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-bold text-cocoa-800 md:flex" aria-label="Sections">
            <a href="#treats" className="hover:text-pink-500">Treats</a>
            {gallery.length > 0 && (
              <a href="#gallery" className="hover:text-pink-500">Gallery</a>
            )}
            <a href="#occasions" className="hover:text-pink-500">Occasions</a>
            <a href="#how" className="hover:text-pink-500">How to order</a>
            <a href="#faq" className="hover:text-pink-500">FAQ</a>
          </nav>
          <InstagramButton className="!h-11 !px-5 text-sm">
            <span className="sm:hidden">Order</span>
            <span className="hidden sm:inline">Order on Instagram</span>
          </InstagramButton>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:pt-20">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-gold-400/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <Image
              src={asset("/logo.svg")}
              alt={`${site.name} logo`}
              width={140}
              height={140}
              priority
              className="animate-drip mb-6 drop-shadow-lg"
            />
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-cocoa-600">
              {site.location.area}
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-cocoa-900 sm:text-6xl">
              {site.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-cocoa-700">{site.subtitle}</p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <InstagramButton>Order on Instagram</InstagramButton>
              <a
                href="#treats"
                className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-base font-bold text-cocoa-900 shadow-soft ring-2 ring-cocoa-200 transition hover:bg-cream-100"
              >
                See the treats
              </a>
            </div>
            <p className="mt-6 text-sm text-cocoa-600">
              Serving {site.location.serves.join(" · ")}. Local pickup only.
            </p>
          </div>
        </section>

        {/* Current drop */}
        {site.currentDrop.enabled && (
          <section className="px-4" aria-labelledby="drop-title">
            <div className="mx-auto max-w-6xl">
              <div className="relative overflow-hidden rounded-blob bg-cocoa-900 px-6 py-8 text-cream-50 shadow-soft sm:px-10 sm:py-10">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-pink-500/40 blur-2xl"
                  aria-hidden="true"
                />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-pink-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
                      {site.currentDrop.label}
                    </span>
                    <h2 id="drop-title" className="mt-3 text-3xl font-semibold sm:text-4xl">
                      {site.currentDrop.title}
                    </h2>
                    <p className="mt-2 text-base leading-relaxed text-cream-200">{site.currentDrop.text}</p>
                    {site.currentDrop.secondary && (
                      <p className="mt-3 text-sm text-cream-200/80">🎃 {site.currentDrop.secondary}</p>
                    )}
                  </div>
                  <InstagramButton className="shrink-0">{site.currentDrop.cta}</InstagramButton>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Product lines */}
        <Section id="treats" eyebrow="The menu" title="Chocolate-covered everything">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {productLines.map((line, i) => (
              <ProductTile key={line.slug} line={line} index={i} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-cocoa-600">
            Every order is made to match your colors, theme, or character. Pricing and minimums are shared when you
            message.
          </p>
        </Section>

        {/* Gallery */}
        {gallery.length > 0 && (
          <Section id="gallery" eyebrow="Fresh from the kitchen" title="Gallery">
            <Gallery items={gallery} />
            <div className="mt-10 flex justify-center">
              <InstagramButton variant="secondary" href={site.instagram.url}>
                See more on Instagram
              </InstagramButton>
            </div>
          </Section>
        )}

        {/* Occasions */}
        <Section id="occasions" eyebrow="Made for" title="Every occasion worth celebrating" className="bg-cream-100">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {occasions.map((o) => (
              <li
                key={o.name}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 font-bold text-cocoa-900 shadow-soft ring-1 ring-cocoa-200/60"
              >
                <span className="text-2xl" aria-hidden="true">
                  {o.emoji}
                </span>
                {o.name}
              </li>
            ))}
          </ul>
        </Section>

        {/* How to order */}
        <Section id="how" eyebrow="Ordering" title="Three steps to something sweet">
          <ol className="grid gap-5 sm:grid-cols-3">
            {howToOrder.map((s) => (
              <li key={s.step} className="rounded-blob bg-white p-6 shadow-soft ring-1 ring-cocoa-200/60">
                <span className="font-display inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-400 text-lg font-bold text-cocoa-900">
                  {s.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-cocoa-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cocoa-700">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <InstagramButton>Message @{site.instagram.handle}</InstagramButton>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq" eyebrow="Good to know" title="Questions, answered" className="bg-cream-100">
          <div className="mx-auto max-w-3xl divide-y divide-cocoa-200 rounded-blob bg-white shadow-soft ring-1 ring-cocoa-200/60">
            {faq.map((item) => (
              <details key={item.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-lg font-semibold text-cocoa-900">
                  {item.q}
                  <svg
                    className="faq-chevron h-5 w-5 shrink-0 text-pink-500 transition"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
                  </svg>
                </summary>
                <p className="mt-3 text-base leading-relaxed text-cocoa-700">{item.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* Signup */}
        <Section id="signup" eyebrow="Don't miss a drop" title="Get first dibs on preorders">
          <div className="mx-auto max-w-xl text-center">
            <p className="mb-6 text-base text-cocoa-700">
              Drops are limited and sell out fast. Get an email when a new one opens, plus seasonal treats before they
              hit Instagram.
            </p>
            <SignupForm />
            <p className="mt-3 text-xs text-cocoa-600">No spam. Unsubscribe anytime.</p>
          </div>
        </Section>
      </main>

      <footer className="border-t border-cocoa-200/60 bg-cocoa-900 px-4 py-10 text-cream-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-xl font-semibold text-cream-50">{site.name}</p>
            <p className="mt-1 text-sm">
              {site.location.area}. Serving {site.location.serves.join(", ")}.
            </p>
            <p className="mt-1 text-sm">{site.location.pickupNote}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm sm:items-end">
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="font-bold text-cream-50 hover:text-pink-500">
              @{site.instagram.handle}
            </a>
            <a href={`mailto:${site.email}`} className="hover:text-pink-500">
              {site.email}
            </a>
            <p className="text-xs text-cream-200/70">© {new Date().getFullYear()} {site.legalName}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
