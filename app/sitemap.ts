import type { MetadataRoute } from "next";

import { getPublishedArticles } from "@/src/lib/articles";
import { absoluteUrl, getSeoPagesForSitemap, seoToSitemap } from "@/src/lib/seo";

const legalPaths = [
  "/legal/terms",
  "/legal/privacy",
  "/legal/consent",
  "/legal/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, articles] = await Promise.all([
    getSeoPagesForSitemap(),
    getPublishedArticles(),
  ]);

  const legalPages: MetadataRoute.Sitemap = legalPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date("2026-07-13T00:00:00+03:00"),
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  const requiredPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/faq"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/blog/${article.slug}`),
    lastModified: article.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const entries = [
    ...pages.map(seoToSitemap),
    ...requiredPages,
    ...articlePages,
    ...legalPages,
  ];

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
