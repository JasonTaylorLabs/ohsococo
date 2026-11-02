import type { MetadataRoute } from "next";
export const dynamic = "force-static";
import { absoluteUrl } from "@/lib/paths";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl(), lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
