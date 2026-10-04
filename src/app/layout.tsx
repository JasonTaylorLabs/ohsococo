import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { site } from "@/content/site";
import { asset } from "@/lib/paths";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const title = `${site.name} | Cake Pops, Cakesicles & Chocolate-Covered Treats in Orange County, NY`;
const description = `${site.tagline}. Custom cake pops, cakesicles, mini donuts, chocolate-covered Oreos and pretzels for birthdays, showers, and holidays. Local pickup in Orange County and Rockland County, NY.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description,
  keywords: [
    "cake pops Orange County NY",
    "custom treats Rockland County",
    "cakesicles Hudson Valley",
    "chocolate covered Oreos NY",
    "mini donuts Orange County",
    "Oh So Coco",
  ],
  openGraph: {
    title,
    description,
    url: site.url,
    siteName: site.name,
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${site.name} - ${site.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: asset("/icon.svg") },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: site.name,
    description,
    url: site.url,
    email: site.email,
    image: `${site.url}/og.png`,
    logo: `${site.url}/logo.svg`,
    sameAs: [site.instagram.url],
    address: {
      "@type": "PostalAddress",
      addressRegion: site.location.region,
      addressCountry: site.location.country,
    },
    areaServed: site.location.serves.map((name) => ({ "@type": "Place", name })),
    servesCuisine: "Desserts",
    priceRange: "$$",
  };

  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <a href="#top" className="sr-only focus:not-sr-only focus:z-50 focus:fixed focus:mt-4 focus:left-4 focus:rounded focus:bg-pink-500 focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
        {children}
      </body>
    </html>
  );
}
