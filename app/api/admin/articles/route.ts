import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { desc } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";
import { createUniqueSlug } from "@/src/lib/articles";
import { parsePublicationDate } from "@/src/lib/article-publication-date";
import { requireAdminApiSession } from "@/src/lib/admin-api";

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

export async function GET(request: Request) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;
  const data = await db
    .select()
    .from(articles)
    .orderBy(desc(articles.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;
  const body = (await request.json()) as Record<string, unknown>;
  const article = readArticleBody(body);
  const publicationDate = parsePublicationDate(article.publicationDate);

  if (!article.article.title || !article.article.category || !article.article.excerpt || !article.article.content || !publicationDate) {
    return NextResponse.json(
      { error: "Заполните заголовок, рубрику, описание, текст и дату публикации." },
      { status: 400 }
    );
  }

  const [createdArticle] = await db
    .insert(articles)
    .values({
      ...article.article,
      createdAt: publicationDate,
      slug: await createUniqueSlug(article.article.title),
    })
    .returning();

  revalidatePath("/sitemap.xml");

  return NextResponse.json(createdArticle, { status: 201 });
}
