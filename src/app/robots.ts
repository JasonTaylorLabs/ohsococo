import type { MetadataRoute } from "next";
export const dynamic = "force-static";
import { absoluteUrl } from "@/lib/paths";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
