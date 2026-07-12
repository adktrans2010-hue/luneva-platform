import "dotenv/config";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";

type SeoItem = {
  url: string;
  slug: string;
  h1: string;
  image: string;
  image_alt?: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword?: string;
  faqJson: string;
  canonicalSuggestion?: string;
  isLikelyDuplicate?: boolean;
};

type SeoPackage = {
  articles: SeoItem[];
};

type ReportItem = {
  url: string;
  slug: string;
  matched: boolean;
  articleId?: string;
  changedFields: string[];
  warnings: string[];
  duplicate: boolean;
  error?: string;
};

const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !shouldApply;
const skipMissing = args.includes("--skip-missing");
const slugArg = args.find((arg) => arg.startsWith("--slug="));
const sourceArg = args.find((arg) => arg.startsWith("--source="));
const sourcePath = resolve(
  sourceArg?.replace("--source=", "") ??
    ".tmp-seo-package/articles-seo.json"
);
const onlySlug = slugArg?.replace("--slug=", "").trim();

function slugFromUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    return "";
  }
}

function parseFaq(value: string) {
  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("FAQ is not an array");
  }

  for (const item of parsed) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { question?: unknown }).question !== "string" ||
      typeof (item as { answer?: unknown }).answer !== "string"
    ) {
      throw new Error("FAQ item has invalid shape");
    }
  }

  return JSON.stringify(parsed);
}

function imageExists(image: string) {
  if (!image || !image.startsWith("/")) {
    return false;
  }

  return existsSync(join(resolve("public"), image));
}

async function main() {
  if (!existsSync(sourcePath)) {
    throw new Error(`SEO source file not found: ${sourcePath}`);
  }

  const seoPackage = JSON.parse(readFileSync(sourcePath, "utf8")) as SeoPackage;
  const items = onlySlug
    ? seoPackage.articles.filter((item) => item.slug === onlySlug)
    : seoPackage.articles;
  const existingArticles = await db.select().from(articles);
  const bySlug = new Map(existingArticles.map((article) => [article.slug, article]));
  const backupDir = resolve("tmp", "article-seo-import-backups");
  const report: ReportItem[] = [];
  const operations: Array<() => Promise<void>> = [];

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, `articles-before-seo-import-${Date.now()}.json`),
    JSON.stringify(existingArticles, null, 2),
    "utf8"
  );

  for (const item of items) {
    const urlSlug = slugFromUrl(item.url);
    const matchSlug = bySlug.has(urlSlug) ? urlSlug : item.slug;
    const article = bySlug.get(matchSlug);
    const changedFields: string[] = [];
    const warnings: string[] = [];

    if (!article) {
      report.push({
        url: item.url,
        slug: item.slug,
        matched: false,
        changedFields,
        warnings,
        duplicate: Boolean(item.isLikelyDuplicate),
        error: "Article not found by URL slug or slug",
      });
      continue;
    }

    let faq: string;

    try {
      faq = parseFaq(item.faqJson);
    } catch (error) {
      report.push({
        url: item.url,
        slug: item.slug,
        matched: true,
        articleId: article.id,
        changedFields,
        warnings,
        duplicate: Boolean(item.isLikelyDuplicate),
        error: error instanceof Error ? error.message : "Invalid FAQ",
      });
      continue;
    }

    const patch: Partial<typeof articles.$inferInsert> = {};

    if (article.h1 !== item.h1) {
      patch.h1 = item.h1;
      changedFields.push("h1");
    }

    if (article.seoTitle !== item.seoTitle) {
      patch.seoTitle = item.seoTitle;
      changedFields.push("seoTitle");
    }

    if (article.seoDescription !== item.seoDescription) {
      patch.seoDescription = item.seoDescription;
      changedFields.push("seoDescription");
    }

    if (article.faq !== faq) {
      patch.faq = faq;
      changedFields.push("faq");
    }

    if (item.image) {
      if (imageExists(item.image)) {
        if (article.image !== item.image) {
          patch.image = item.image;
          changedFields.push("image");
        }
      } else {
        warnings.push(`Image not found, current image kept: ${item.image}`);
      }
    }

    if (item.image_alt) {
      warnings.push("image_alt skipped: articles table has no imageAlt field");
    }

    if (item.primaryKeyword) {
      warnings.push("primaryKeyword skipped: articles table has no keyword field");
    }

    if (item.isLikelyDuplicate) {
      warnings.push(
        `Possible duplicate; canonical suggested but not applied: ${item.canonicalSuggestion ?? ""}`
      );
    }

    if (changedFields.length > 0) {
      operations.push(async () => {
        await db
          .update(articles)
          .set({ ...patch, updatedAt: new Date() })
          .where(eq(articles.id, article.id));
      });
    }

    report.push({
      url: item.url,
      slug: item.slug,
      matched: true,
      articleId: article.id,
      changedFields,
      warnings,
      duplicate: Boolean(item.isLikelyDuplicate),
    });
  }

  const reportPath = resolve("article-seo-import-report.json");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        sourcePath,
        dryRun,
        total: report.length,
        matched: report.filter((item) => item.matched).length,
        changed: report.filter((item) => item.changedFields.length > 0).length,
        errors: report.filter((item) => item.error).length,
        duplicates: report.filter((item) => item.duplicate).length,
        items: report,
      },
      null,
      2
    ),
    "utf8"
  );

  console.table(
    report.map((item) => ({
      slug: item.slug,
      matched: item.matched,
      changed: item.changedFields.join(", "),
      warnings: item.warnings.length,
      duplicate: item.duplicate,
      error: item.error ?? "",
    }))
  );

  const errors = report.filter((item) => item.error);

  if (errors.length > 0 && !skipMissing) {
    throw new Error(`SEO import stopped: ${errors.length} errors. See ${reportPath}`);
  }

  if (dryRun) {
    console.log(`Dry-run complete. No database changes. Report: ${reportPath}`);
    return;
  }

  for (const operation of operations) {
    await operation();
  }

  console.log(`SEO import applied. Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
