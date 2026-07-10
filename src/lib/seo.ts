import type { MetadataRoute, Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { seoPages } from "@/src/db/schema";

export type SeoPage = typeof seoPages.$inferSelect;

export const siteUrl = "https://luneva-psy.ru";

export async function getSeoPage(path: string) {
  const [page] = await db
    .select()
    .from(seoPages)
    .where(eq(seoPages.path, normalizePath(path)))
    .limit(1);

  return page;
}

export async function getSeoPagesForSitemap() {
  return db
    .select()
    .from(seoPages)
    .where(and(eq(seoPages.includeInSitemap, true), eq(seoPages.noindex, false)))
    .orderBy(asc(seoPages.path));
}

export function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

export function absoluteUrl(path: string) {
  return new URL(normalizePath(path), siteUrl).toString();
}

export function seoToMetadata(page?: SeoPage): Metadata {
  if (!page) {
    return {
      title: "Luneva Psy",
      description: "Психолог Александра Лунева. Консультации онлайн и очно.",
    };
  }

  const canonical = page.canonical || page.path;

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: absoluteUrl(canonical),
    },
    robots: {
      index: !page.noindex,
      follow: !page.noindex,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: absoluteUrl(canonical),
      siteName: "Luneva Psy",
      locale: "ru_RU",
      type: "website",
    },
  };
}

export function seoToSitemap(page: SeoPage): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(page.canonical || page.path),
    lastModified: page.updatedAt,
    changeFrequency:
      page.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: Number(page.priority) || 0.7,
  };
}
