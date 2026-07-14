import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    seoTitle: String(body.seoTitle ?? "").trim() || null,
    seoDescription: String(body.seoDescription ?? "").trim() || null,
    h1: String(body.h1 ?? "").trim() || null,
    image: String(body.image ?? "").trim() || null,
    faq: String(body.faq ?? "").trim() || null,
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

  revalidatePath("/sitemap.xml");

  return NextResponse.json(updatedArticle);
}

export async function DELETE(_request: Request, { params }: ArticleParams) {
  const { id } = await params;

  await db.delete(articles).where(eq(articles.id, id));

  revalidatePath("/sitemap.xml");

  return NextResponse.json({ success: true });
}
