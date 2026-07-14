import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { sitePages } from "@/src/db/schema";
import { normalizePath } from "@/src/lib/seo";

export type SitePage = typeof sitePages.$inferSelect;

export async function getPublishedSitePage(path: string) {
  const [page] = await db
    .select()
    .from(sitePages)
    .where(eq(sitePages.path, normalizePath(path)))
    .limit(1);

  return page?.published ? page : null;
}
