/**
 * All V1 landing-page content lives here so the owner (or a developer) can
 * change copy, product lines, the current drop, and FAQ without touching
 * components. Items marked CONFIRM were not visible on the public Instagram
 * profile and should be checked with the owner before launch.
 */

export const site = {
  name: "Oh So Coco",
  legalName: "Oh So Coco",
  tagline: "Chocolate-covered treats & more",
  subtitle: "Cake pops, cakesicles, mini donuts, Oreos and more. Crafted with love, made to indulge.",
  url: "https://jasontaylorlabs.github.io/ohsococo", // CONFIRM: swap for the real domain once registered
  email: "hello@ohsococo.com", // CONFIRM: business email
  instagram: {
    handle: "ohsococo_",
    url: "https://www.instagram.com/ohsococo_/",
    dmUrl: "https://ig.me/m/ohsococo_",
  },
  location: {
    area: "Orange County, New York",
    serves: ["Orange County, NY", "Rockland County, NY", "Hudson Valley"],
    pickupNote: "Local pickup only. The pickup spot is shared when your order is confirmed.",
    region: "NY",
    country: "US",
  },
  currentDrop: {
    enabled: true,
    label: "Now taking preorders",
    title: "Ring Pop Cake Pops",
    text: "The cutest little throwback treat, fully edible. Limited availability, so message to claim yours. Pickup date confirmed once you order.",
    cta: "Claim yours on Instagram",
    secondary: "Halloween preorders are coming soon. Eyeballs, Ghostface, and bloody details.",
  },
} as const;

export type ProductLine = {
  slug: string;
  name: string;
  blurb: string;
  emoji: string;
  /** Path under /public. Placeholder tile is shown until a real photo exists. */
  image?: string;
  flavors?: string[];
};

export const productLines: ProductLine[] = [
  {
    slug: "cake-pops",
    name: "Cake Pops",
    blurb: "Custom themed for birthdays, baby showers, baptisms, team send-offs, and anything worth celebrating.",
    emoji: "🍭",
  },
  {
    slug: "cakesicles",
    name: "Cakesicles",
    blurb: "Popsicle-shaped cake dipped in chocolate. Teddy bears, hearts, and whatever your party needs.",
    emoji: "🍰",
  },
  {
    slug: "mini-donuts",
    name: "Mini Donuts",
    blurb: "Tiny in size, big on flavor. Your childhood favorites got a mini donut makeover.",
    emoji: "🍩",
    flavors: [
      "Cinnamon Sugar",
      "Sprinkles",
      "Cinnamon Toast Crunch",
      "Fruity Pebbles",
      "Biscoff",
      "Cookies + Cream",
      "Nerds",
      "Lucky Charms",
      "Oreo",
      "S'mores",
      "Wild Berry Froot Loops",
    ],
  },
  {
    slug: "oreos",
    name: "Chocolate-Covered Oreos",
    blurb: "Dipped, decorated, and matched to your colors or theme.",
    emoji: "🍫",
  },
  {
    slug: "pretzels",
    name: "Chocolate-Covered Pretzels",
    blurb: "Sweet and salty rods dressed up for dessert tables and gift boxes.",
    emoji: "🥨",
  },
  {
    slug: "rice-krispies",
    name: "Rice Krispies",
    blurb: "Crispy treats dipped in chocolate and decorated to match the party.",
    emoji: "✨",
  },
  {
    slug: "mystery-dumplings",
    name: "Mystery Dumplings",
    blurb: "Cake pops in mystery flavors, individually wrapped. A lucky few hide a gold or shimmer winner.",
    emoji: "🥟",
  },
];

export type GalleryItem = {
  caption: string;
  /** Shown on the placeholder tile until a real photo exists. */
  emoji: string;
  /** Path under /public, e.g. "/products/ring-pops.jpg". Square, at least 1200x1200. */
  image?: string;
  /** Describes what the photo shows beyond the caption. Leave unset if the caption says it all. */
  alt?: string;
};

/** Gallery tiles, in display order. Leave the list empty to hide the section. */
export const gallery: GalleryItem[] = [
  { caption: "Ring Pop cake pops", emoji: "💍" },
  { caption: "Birthday cake pops", emoji: "🎂" },
  { caption: "Teddy bear cakesicles", emoji: "🧸" },
  { caption: "Chocolate-covered Oreos", emoji: "🍪" },
  { caption: "Mini donuts", emoji: "🍩" },
  { caption: "Halloween eyeballs", emoji: "🎃" },
  { caption: "Baby shower set", emoji: "🍼" },
  { caption: "Party favor boxes", emoji: "🎁" },
];

export const occasions = [
  { name: "Birthdays", emoji: "🎂" },
  { name: "Baby showers", emoji: "🧸" },
  { name: "Baptisms", emoji: "🕊️" },
  { name: "Halloween & holidays", emoji: "🎃" },
  { name: "Team send-offs", emoji: "🥎" },
  { name: "Party favors", emoji: "🎁" },
  { name: "Bridal & girls' nights", emoji: "💍" },
  { name: "Class treats", emoji: "🍎" },
];

export const howToOrder = [
  {
    step: "1",
    title: "Pick a treat or a theme",
    text: "Browse the lines above, or bring your own idea: colors, characters, a team logo, anything.",
  },
  {
    step: "2",
    title: "Send a message",
    text: "Tap the Instagram button and share your occasion, date, and how many you need.",
  },
  {
    step: "3",
    title: "Pick up locally",
    text: "You get a quote and a pickup date. Treats are handed over fresh in Orange County, NY.",
  },
];

export const faq = [
  {
    q: "How do I place an order?",
    a: "Message @ohsococo_ on Instagram with your occasion, event date, and quantity. Online ordering is coming to this site soon.",
  },
  {
    q: "Where are you located?",
    a: "Orange County, New York. Orders are for local pickup and customers come from across Orange County, Rockland County, and the Hudson Valley.",
  },
  {
    q: "Do you deliver or ship?",
    a: "Not right now. All orders are pickup only.",
  },
  {
    q: "How far in advance should I order?",
    a: "The sooner the better for custom themes. Preorder drops are limited and usually claimed within a day or two, so message as soon as you see one.", // CONFIRM lead time
  },
  {
    q: "Can you match a theme, colors, or a character?",
    a: "Yes. Most orders are fully custom: birthday themes, team colors, baby shower motifs, holiday designs, and more. Send a reference photo if you have one.",
  },
  {
    q: "What about allergens?",
    a: "Treats are made in a home kitchen that also handles dairy, wheat, soy, and cereal toppings. Ask before ordering if you have a nut or other allergy.", // CONFIRM allergen statement
  },
  {
    q: "How do I pay?",
    a: "Payment details are confirmed when your order is accepted.", // CONFIRM payment methods
  },
];
