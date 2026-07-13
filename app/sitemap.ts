import type { MetadataRoute } from "next";

import { absoluteUrl, getSeoPagesForSitemap, seoToSitemap } from "@/src/lib/seo";

const legalPaths = [
  "/legal/terms",
  "/legal/privacy",
  "/legal/consent",
  "/legal/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getSeoPagesForSitemap();

  const legalPages: MetadataRoute.Sitemap = legalPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date("2026-07-13T00:00:00+03:00"),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...pages.map(seoToSitemap), ...legalPages];
}
