import Image from "next/image";
import type { GalleryItem } from "@/content/site";
import { asset } from "@/lib/paths";
import { tints } from "@/components/ProductTile";

export function Gallery({ items }: { items: GalleryItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.caption}>
          <figure className="overflow-hidden rounded-blob bg-white shadow-soft ring-1 ring-cocoa-200/60">
            <div className={`relative aspect-square w-full bg-gradient-to-br ${tints[i % tints.length]}`}>
              {item.image ? (
                <Image
                  src={asset(item.image)}
                  alt={item.alt ?? ""}
                  fill
                  loading="lazy"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-6xl sm:text-7xl" aria-hidden="true">
                  {item.emoji}
                </div>
              )}
            </div>
            <figcaption className="px-4 py-3 text-sm font-bold text-cocoa-900">{item.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
