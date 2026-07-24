import type { MetadataRoute } from "next";

import { getPublishedArticles } from "@/src/lib/articles";
import { absoluteUrl, getSeoPagesForSitemap, seoToSitemap } from "@/src/lib/seo";
import { blogCategoryLinks, matchesBlogCategory } from "@/src/lib/navigation";
import { rppPages } from "@/src/lib/rpp-pages";

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
      url: absoluteUrl("/requisites"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
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

  const blogCategoryPages: MetadataRoute.Sitemap = blogCategoryLinks
    .filter((category) =>
      articles.some((article) => matchesBlogCategory(article.category, category.aliases)),
    )
    .map((category) => ({
      url: absoluteUrl(category.href),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  const rppPagesForSitemap: MetadataRoute.Sitemap = Object.entries(rppPages)
    .filter(([, page]) => page.status === "published")
    .map(([slug]) => ({
      url: absoluteUrl(slug ? `/rpp/${slug}` : "/rpp"),
      lastModified: new Date("2026-07-22T00:00:00+03:00"),
      changeFrequency: "monthly",
      priority: slug ? 0.7 : 0.8,
    }));

  const entries = [
    ...pages.map(seoToSitemap),
    ...requiredPages,
    ...articlePages,
    ...blogCategoryPages,
    ...rppPagesForSitemap,
    ...legalPages,
  ];

  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
