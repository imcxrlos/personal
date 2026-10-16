import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { securityArticles } from "@/lib/security";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${site.domain}`;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/projects`, lastModified: now, priority: 0.8 },
    { url: `${base}/security`, lastModified: now, priority: 0.8 },
    ...securityArticles.map((a) => ({
      url: `${base}/security/${a.slug}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
