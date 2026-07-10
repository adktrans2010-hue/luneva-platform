import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";

export type Article = typeof articles.$inferSelect;

const transliterationMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((letter) => transliterationMap[letter] ?? letter)
    .join("");
}

export function createSlug(value: string) {
  const slug = transliterate(value)
    .trim()
    .normalize("NFC")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "article";
}

export async function createUniqueSlug(title: string, currentId?: string) {
  const baseSlug = createSlug(title);
  let slug = baseSlug;
  let index = 2;

  while (true) {
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        currentId
          ? and(eq(articles.slug, slug), ne(articles.id, currentId))
          : eq(articles.slug, slug)
      )
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${index}`;
    index += 1;
  }
}

export async function getPublishedArticles() {
  return db
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.createdAt));
}

export async function getPublishedArticleBySlug(slug: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.published, true)))
    .limit(1);

  return article;
}

export async function getRelatedPublishedArticles(article: Article, limit = 3) {
  const category = article.category.trim();

  return db
    .select()
    .from(articles)
    .where(
      category.length > 0
        ? and(
            eq(articles.published, true),
            eq(articles.category, category),
            ne(articles.id, article.id)
          )
        : and(eq(articles.published, true), ne(articles.id, article.id))
    )
    .orderBy(desc(articles.createdAt))
    .limit(limit);
}
