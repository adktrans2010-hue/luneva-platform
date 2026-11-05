import "dotenv/config";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { loadPublishedArticleStatusSlugs } from "@/scripts/article-status-recovery";

async function main() {
  const { slugs, conflicts } = loadPublishedArticleStatusSlugs();

  console.log(`PUBLISHED CONFIRMED: ${slugs.length}`);
  if (conflicts.length > 0) {
    console.error(conflicts.join("\n"));
    process.exitCode = 1;
    return;
  }

  if (slugs.length === 0) {
    console.log("ARTICLE STATUS RESTORE: NO CONFIRMED PUBLISHED SLUGS");
    return;
  }

  const changed = await db
    .update(articles)
    .set({ published: true, updatedAt: new Date() })
    .where(and(inArray(articles.slug, slugs), eq(articles.published, false)))
    .returning({ slug: articles.slug });

  console.log(`ARTICLE STATUS RESTORE: UPDATED ${changed.length}`);
  for (const article of changed) console.log(article.slug);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Article status restore failed");
  process.exitCode = 1;
});
