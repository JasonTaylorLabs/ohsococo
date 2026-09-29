import { site } from "@/content/site";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstagramButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const base =
    "inline-flex h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-bold shadow-soft transition focus:outline-none focus:ring-4 focus:ring-pink-500/30";
  const styles =
    variant === "primary"
      ? "bg-pink-500 text-white hover:bg-pink-600"
      : "bg-white text-cocoa-900 ring-2 ring-cocoa-200 hover:bg-cream-100";
  return (
    <a href={site.instagram.dmUrl} target="_blank" rel="noopener noreferrer" className={`${base} ${styles} ${className}`}>
      <InstagramIcon />
      {children}
    </a>
  );
}
