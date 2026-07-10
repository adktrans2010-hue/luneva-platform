import type { MetadataRoute } from "next";

import { getSeoPagesForSitemap, seoToSitemap } from "@/src/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getSeoPagesForSitemap();

  return pages.map(seoToSitemap);
}
