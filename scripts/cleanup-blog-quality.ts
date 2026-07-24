import "dotenv/config";

import { Pool } from "pg";

import { ARCHIVED_ARTICLE_SLUGS } from "@/src/lib/article-archive";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dryRun = process.argv.includes("--dry-run");

const textReplacements: Array<[string, string]> = [
  ["ПРОВЕРЬ,ЕСТЬ", "Проверь, есть"],
  ["ПРОВЕРЬ, ЕСТЬ", "Проверь, есть"],
  ["не пугайтесь своих чувства", "не пугайтесь своих чувств"],
  ["Не пугайтесь своих чувства", "Не пугайтесь своих чувств"],
  ["ребенок становиться подростком", "ребёнок становится подростком"],
  ["Ребенок становиться подростком", "Ребёнок становится подростком"],
  [
    "По статистике 10% молодых людей причиняют себе вред. Это означает, что как минимум 2 из подростков в классе причиняли себе самоповреждение.",
    "Самоповреждающее поведение встречается у подростков и молодых людей чаще, чем принято обсуждать вслух.",
  ],
];

const titleUpdates: Record<string, string> = {
  "chto-nuzhno-delat-esli-vy-popali-v-krizisnuyu-situaciyu":
    "Что делать, если вы попали в кризисную ситуацию",
};

function cleanupText(value: string | null) {
  if (!value) return value;

  return textReplacements.reduce(
    (text, [from, to]) => text.split(from).join(to),
    value
  );
}

function previewChange(before: string | null, after: string | null) {
  if (before === after) return null;

  return {
    before: before?.slice(0, 240) ?? null,
    after: after?.slice(0, 240) ?? null,
  };
}

async function main() {
  const archived = dryRun
    ? await pool.query<{ slug: string }>(
        "select slug from articles where slug = any($1::text[]) and published = true",
        [ARCHIVED_ARTICLE_SLUGS]
      )
    : await pool.query<{ slug: string }>(
        "update articles set published=false, updated_at=now() where slug = any($1::text[]) returning slug",
        [ARCHIVED_ARTICLE_SLUGS]
      );

  const articles = await pool.query<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
  }>("select id, slug, title, excerpt, content from articles");

  let updatedTexts = 0;
  const changes: Array<{
    id: string;
    slug: string;
    title: string;
    fields: Array<{
      field: "title" | "excerpt" | "content";
      reason: string;
      before: string | null;
      after: string | null;
    }>;
  }> = [];

  for (const article of articles.rows) {
    const title = titleUpdates[article.slug] ?? article.title;
    const excerpt = cleanupText(article.excerpt);
    const content = cleanupText(article.content);
    const fields = [
      { field: "title" as const, reason: "manual title cleanup", change: previewChange(article.title, title) },
      { field: "excerpt" as const, reason: "text quality cleanup", change: previewChange(article.excerpt, excerpt) },
      { field: "content" as const, reason: "text quality cleanup", change: previewChange(article.content, content) },
    ]
      .filter((item) => item.change)
      .map((item) => ({
        field: item.field,
        reason: item.reason,
        before: item.change?.before ?? null,
        after: item.change?.after ?? null,
      }));

    if (
      title !== article.title ||
      excerpt !== article.excerpt ||
      content !== article.content
    ) {
      if (!dryRun) {
        await pool.query(
          "update articles set title=$1, excerpt=$2, content=$3, updated_at=now() where id=$4",
          [title, excerpt, content, article.id]
        );
      }
      updatedTexts += 1;
      changes.push({
        id: article.id,
        slug: article.slug,
        title: article.title,
        fields,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        archived: archived.rows.map((row) => row.slug),
        updatedTexts,
        changes,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
