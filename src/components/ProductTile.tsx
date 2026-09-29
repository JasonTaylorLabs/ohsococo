import Image from "next/image";
import type { ProductLine } from "@/content/site";
import { asset } from "@/lib/paths";

const tints = [
  "from-pink-500/25 to-cream-200",
  "from-gold-400/35 to-cream-200",
  "from-cocoa-600/30 to-cream-200",
  "from-cream-300 to-pink-500/20",
];

export function ProductTile({ line, index }: { line: ProductLine; index: number }) {
  const tint = tints[index % tints.length];
  return (
    <article className="group flex flex-col overflow-hidden rounded-blob bg-white shadow-soft ring-1 ring-cocoa-200/60 transition hover:-translate-y-1">
      <div className={`relative aspect-square w-full bg-gradient-to-br ${tint}`}>
        {line.image ? (
          <Image
            src={asset(line.image)}
            alt={line.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl" aria-hidden="true">
            <span className="transition group-hover:scale-110">{line.emoji}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-xl font-semibold text-cocoa-900">{line.name}</h3>
        <p className="text-sm leading-relaxed text-cocoa-700">{line.blurb}</p>
        {line.flavors && (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={`${line.name} flavors`}>
            {line.flavors.map((f) => (
              <li key={f} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-cocoa-800">
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
