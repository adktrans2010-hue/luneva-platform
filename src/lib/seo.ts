import type { MetadataRoute, Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { seoPages } from "@/src/db/schema";

export type SeoPage = typeof seoPages.$inferSelect;

export const siteUrl = "https://luneva-psy.ru";

export const defaultSocialImage = {
  url: `${siteUrl}/api/og-image`,
  width: 1200,
  height: 630,
  alt: "Лунева Александра — психолог",
};

function isLocalDbFreeBuild() {
  return process.env.LOCAL_BUILD_NO_DB === "1";
}

export async function getSeoPage(path: string) {
  if (isLocalDbFreeBuild()) return undefined;

  const [page] = await db
    .select()
    .from(seoPages)
    .where(eq(seoPages.path, normalizePath(path)))
    .limit(1);

  return page;
}

export async function getSeoPagesForSitemap() {
  if (isLocalDbFreeBuild()) return [];

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

export function seoToMetadata(page?: SeoPage, fallbackPath = "/"): Metadata {
  if (!page) {
    const title = "Luneva Psy";
    const description = "Психолог Александра Лунева. Консультации онлайн и очно.";
    const canonical = absoluteUrl(fallbackPath);

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: "Luneva Psy",
        locale: "ru_RU",
        type: "website",
        images: [defaultSocialImage],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [defaultSocialImage.url],
      },
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
      images: [defaultSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [defaultSocialImage.url],
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
