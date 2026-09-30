import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

// /underworld stays out: it's a secret (noindex), not a landing page.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, changeFrequency: "monthly", priority: 1 }];
}
