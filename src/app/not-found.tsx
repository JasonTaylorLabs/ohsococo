import Link from "next/link";

export default function NotFound() {
  return (
    <main id="top" className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-4xl font-bold text-cocoa-900 sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-lg text-cocoa-700">That page doesn&apos;t exist, but the treats do.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-base font-bold text-cocoa-900 shadow-soft ring-2 ring-cocoa-200 transition hover:bg-cream-100"
      >
        Back to the homepage
      </Link>
    </main>
  );
}
