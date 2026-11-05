import "dotenv/config";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import {
  loadRecoveryArticleSource,
  printRecoveryArticleReport,
} from "@/scripts/recovery-article-source";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { articles: recoveryArticles, report } = loadRecoveryArticleSource();

  printRecoveryArticleReport(report);
  if (report.conflicts.length > 0) {
    console.error(report.conflicts.join("\n"));
    process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log("RECOVERY ARTICLE SEED DRY RUN: PASS");
    return;
  }

  for (const article of recoveryArticles) {
    await db
      .insert(articles)
      .values({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        content: article.content,
        h1: article.h1,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        faq: article.faq,
        published: article.status === "published",
      })
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          content: article.content,
          h1: article.h1,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          faq: article.faq,
          published: article.status === "published",
          updatedAt: new Date(),
        },
      });
  }

  console.log(`RECOVERY ARTICLE SEED: UPSERTED ${recoveryArticles.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Recovery article seed failed");
  process.exitCode = 1;
});
