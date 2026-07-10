import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { createUniqueSlug } from "@/src/lib/articles";

type ArticleParams = {
  params: Promise<{
    id: string;
  }>;
};

function readArticleBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "").trim(),
    excerpt: String(body.excerpt ?? "").trim(),
    content: String(body.content ?? "").trim(),
    published: Boolean(body.published),
  };
}

export async function PATCH(request: Request, { params }: ArticleParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const article = readArticleBody(body);

  if (!article.title || !article.category || !article.excerpt || !article.content) {
    return NextResponse.json(
      { error: "Заполните заголовок, рубрику, описание и текст статьи." },
      { status: 400 }
    );
  }

  const [updatedArticle] = await db
    .update(articles)
    .set({
      ...article,
      slug: await createUniqueSlug(article.title, id),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  return NextResponse.json(updatedArticle);
}

export async function DELETE(_request: Request, { params }: ArticleParams) {
  const { id } = await params;

  await db.delete(articles).where(eq(articles.id, id));

  return NextResponse.json({ success: true });
}
