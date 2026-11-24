import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { createUniqueSlug } from "@/src/lib/articles";
import { parsePublicationDate } from "@/src/lib/article-publication-date";
import { requireAdminApiSession } from "@/src/lib/admin-api";

type ArticleParams = {
  params: Promise<{
    id: string;
  }>;
};

function readArticleBody(body: Record<string, unknown>) {
  return {
    article: {
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
    },
    publicationDate: body.publicationDate,
  };
}

export async function PATCH(request: Request, { params }: ArticleParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const article = readArticleBody(body);
  const publicationDate = parsePublicationDate(article.publicationDate);

  if (!article.article.title || !article.article.category || !article.article.excerpt || !article.article.content || !publicationDate) {
    return NextResponse.json(
      { error: "Заполните заголовок, рубрику, описание, текст и дату публикации." },
      { status: 400 }
    );
  }

  const [updatedArticle] = await db
    .update(articles)
    .set({
      ...article.article,
      createdAt: publicationDate,
      slug: await createUniqueSlug(article.article.title, id),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  revalidatePath("/sitemap.xml");

  return NextResponse.json(updatedArticle);
}

export async function DELETE(request: Request, { params }: ArticleParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;
  const { id } = await params;

  await db.delete(articles).where(eq(articles.id, id));

  revalidatePath("/sitemap.xml");

  return NextResponse.json({ success: true });
}
