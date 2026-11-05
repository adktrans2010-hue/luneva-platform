import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type RecoveryManifestItem = {
  id: number;
  title: string;
  slug: string;
  file: string;
};

type RecoveryFrontMatter = {
  id?: number;
  title?: string;
  slug?: string;
  status?: string;
};

type SeoRecord = {
  slug: string;
  category?: string;
  h1?: string;
  seoTitle?: string;
  seoDescription?: string;
  faq?: unknown;
  isLikelyDuplicate?: boolean;
};

export type RecoveryArticle = {
  title: string;
  slug: string;
  status: "draft" | "published";
  category: string;
  excerpt: string;
  content: string;
  h1: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faq: string | null;
};

export type RecoveryArticleReport = {
  manifestCount: number;
  markdownCount: number;
  seoCount: number;
  exactSeoMatches: number;
  seoOnly: string[];
  aliases: string[];
  conflicts: string[];
};

function parseFrontMatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontMatter: RecoveryFrontMatter = {};

  if (!match) return { frontMatter, body: markdown.trim() };

  for (const line of match[1].split(/\r?\n/)) {
    const [rawKey, ...rawValueParts] = line.split(":");
    const key = rawKey.trim();
    const value = rawValueParts.join(":").trim().replace(/^"|"$/g, "");

    if (key === "id") frontMatter.id = Number(value);
    if (key === "title") frontMatter.title = value;
    if (key === "slug") frontMatter.slug = value;
    if (key === "status") frontMatter.status = value;
  }

  return { frontMatter, body: markdown.slice(match[0].length).trim() };
}

function stripLeadingH1(markdown: string) {
  return markdown.replace(/^#\s+.+?(?:\r?\n|$)/, "").trim();
}

function excerptFromContent(content: string) {
  const paragraph = content
    .split(/\r?\n\s*\r?\n/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .find(Boolean);

  if (!paragraph) return "Материал Александры Луневой.";
  return paragraph.length <= 280 ? paragraph : `${paragraph.slice(0, 277).trimEnd()}…`;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function loadRecoveryArticleSource(sourceRoot = resolve("data/recovery/articles")) {
  const manifestPath = join(sourceRoot, "articles_manifest.json");
  const seoPath = join(sourceRoot, "articles-seo.json");
  const conflicts: string[] = [];

  if (!existsSync(manifestPath)) conflicts.push("articles_manifest.json is missing");
  if (!existsSync(seoPath)) conflicts.push("articles-seo.json is missing");
  if (conflicts.length > 0) {
    return { articles: [] as RecoveryArticle[], report: emptyReport(conflicts) };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as RecoveryManifestItem[];
  const seoPayload = JSON.parse(readFileSync(seoPath, "utf8")) as { articles?: SeoRecord[] };
  const seoRecords = seoPayload.articles ?? [];
  const manifestSlugCounts = new Map<string, number>();
  const seoSlugCounts = new Map<string, number>();

  for (const item of manifest) manifestSlugCounts.set(item.slug, (manifestSlugCounts.get(item.slug) ?? 0) + 1);
  for (const item of seoRecords) seoSlugCounts.set(item.slug, (seoSlugCounts.get(item.slug) ?? 0) + 1);

  for (const [slug, count] of manifestSlugCounts) {
    if (count > 1) conflicts.push(`duplicate manifest slug: ${slug}`);
  }
  for (const [slug, count] of seoSlugCounts) {
    if (count > 1) conflicts.push(`duplicate SEO slug: ${slug}`);
  }

  const seoBySlug = new Map(seoRecords.map((item) => [item.slug, item]));
  const articles: RecoveryArticle[] = [];
  let markdownCount = 0;

  for (const item of manifest) {
    const filePath = join(sourceRoot, item.file);
    if (!existsSync(filePath)) {
      conflicts.push(`missing markdown: ${item.file}`);
      continue;
    }

    markdownCount += 1;
    const { frontMatter, body } = parseFrontMatter(readFileSync(filePath, "utf8"));
    if (frontMatter.id !== item.id || frontMatter.title !== item.title || frontMatter.slug !== item.slug) {
      conflicts.push(`manifest/front matter mismatch: ${item.slug}`);
      continue;
    }
    if (frontMatter.status !== "draft" && frontMatter.status !== "published") {
      conflicts.push(`unsupported status for ${item.slug}: ${frontMatter.status ?? "missing"}`);
      continue;
    }

    const content = stripLeadingH1(body);
    if (!content) {
      conflicts.push(`empty markdown body: ${item.slug}`);
      continue;
    }

    const seo = seoBySlug.get(item.slug);
    articles.push({
      title: item.title,
      slug: item.slug,
      status: frontMatter.status,
      category: seo?.category?.trim() || "Полезные статьи",
      excerpt: excerptFromContent(content),
      content,
      h1: seo?.h1?.trim() || null,
      seoTitle: seo?.seoTitle?.trim() || null,
      seoDescription: seo?.seoDescription?.trim() || null,
      faq: seo?.faq ? JSON.stringify(seo.faq) : null,
    });
  }

  const manifestSlugs = new Set(manifest.map((item) => item.slug));
  const aliases = unique(
    seoRecords.filter((item) => !manifestSlugs.has(item.slug) && item.isLikelyDuplicate).map((item) => item.slug)
  );
  const seoOnly = unique(
    seoRecords.filter((item) => !manifestSlugs.has(item.slug) && !item.isLikelyDuplicate).map((item) => item.slug)
  );

  return {
    articles,
    report: {
      manifestCount: manifest.length,
      markdownCount,
      seoCount: seoRecords.length,
      exactSeoMatches: articles.filter((article) => seoBySlug.has(article.slug)).length,
      seoOnly,
      aliases,
      conflicts,
    },
  };
}

function emptyReport(conflicts: string[]): RecoveryArticleReport {
  return {
    manifestCount: 0,
    markdownCount: 0,
    seoCount: 0,
    exactSeoMatches: 0,
    seoOnly: [],
    aliases: [],
    conflicts,
  };
}

export function printRecoveryArticleReport(report: RecoveryArticleReport) {
  console.log(`MANIFEST COUNT: ${report.manifestCount}`);
  console.log(`MARKDOWN COUNT: ${report.markdownCount}`);
  console.log(`SEO COUNT: ${report.seoCount}`);
  console.log(`EXACT SEO MATCHES: ${report.exactSeoMatches}`);
  console.log(`SEO ONLY: ${report.seoOnly.length}`);
  console.log(`ALIASES: ${report.aliases.length}`);
  console.log(`CONFLICTS: ${report.conflicts.length}`);
}
