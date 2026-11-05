import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { loadRecoveryArticleSource } from "@/scripts/recovery-article-source";

type PublishedStatusSource = {
  publishedSlugs?: unknown;
};

export function loadPublishedArticleStatusSlugs(
  sourceRoot = resolve("data/recovery/articles")
) {
  const sourcePath = join(sourceRoot, "published-statuses.json");
  const { articles, report } = loadRecoveryArticleSource(sourceRoot);

  if (report.conflicts.length > 0) {
    return { slugs: [] as string[], conflicts: report.conflicts };
  }

  if (!existsSync(sourcePath)) {
    return { slugs: [] as string[], conflicts: ["published-statuses.json is missing"] };
  }

  const payload = JSON.parse(readFileSync(sourcePath, "utf8")) as PublishedStatusSource;
  const publishedSlugs = payload.publishedSlugs;
  if (!Array.isArray(publishedSlugs) || !publishedSlugs.every((slug) => typeof slug === "string")) {
    return { slugs: [] as string[], conflicts: ["publishedSlugs must be a string array"] };
  }

  const manifestSlugs = new Set(articles.map((article) => article.slug));
  const duplicateSlugs = publishedSlugs.filter(
    (slug, index) => publishedSlugs.indexOf(slug) !== index
  );
  const unknownSlugs = publishedSlugs.filter((slug) => !manifestSlugs.has(slug));
  const conflicts = [
    ...new Set(duplicateSlugs.map((slug) => `duplicate published status slug: ${slug}`)),
    ...new Set(unknownSlugs.map((slug) => `published status slug is not in manifest: ${slug}`)),
  ];

  return { slugs: [...new Set(publishedSlugs)], conflicts };
}
