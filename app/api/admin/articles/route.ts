import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { createUniqueSlug } from "@/src/lib/articles";

function readArticleBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "").trim(),
    excerpt: String(body.excerpt ?? "").trim(),
    content: String(body.content ?? "").trim(),
    published: Boolean(body.published),
  };
}

export async function GET() {
  const data = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const article = readArticleBody(body);

  if (!article.title || !article.category || !article.excerpt || !article.content) {
    return NextResponse.json(
      { error: "Заполните заголовок, рубрику, описание и текст статьи." },
      { status: 400 }
    );
  }

  const [createdArticle] = await db
    .insert(articles)
    .values({
      ...article,
      slug: await createUniqueSlug(article.title),
    })
    .returning();

  return NextResponse.json(createdArticle, { status: 201 });
}
