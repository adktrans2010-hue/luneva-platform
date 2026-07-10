import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { seoPages } from "@/src/db/schema";
import { normalizePath } from "@/src/lib/seo";

type SeoParams = {
  params: Promise<{
    id: string;
  }>;
};

function readSeoBody(body: Record<string, unknown>) {
  const canonical = String(body.canonical ?? "").trim();
  const structuredData = String(body.structuredData ?? "").trim();

  return {
    path: normalizePath(String(body.path ?? "").trim()),
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim(),
    canonical: canonical ? normalizePath(canonical) : null,
    structuredData: structuredData || null,
    includeInSitemap: Boolean(body.includeInSitemap),
    noindex: Boolean(body.noindex),
    priority: String(body.priority ?? "0.7").trim() || "0.7",
    changeFrequency: String(body.changeFrequency ?? "monthly").trim() || "monthly",
  };
}

function validateSeo(item: ReturnType<typeof readSeoBody>) {
  if (!item.path || !item.title || !item.description) {
    return "Заполните адрес страницы, SEO-заголовок и описание.";
  }

  if (item.structuredData) {
    try {
      JSON.parse(item.structuredData);
    } catch {
      return "Микроразметка должна быть корректным JSON-LD.";
    }
  }

  const priority = Number(item.priority);
  if (Number.isNaN(priority) || priority < 0 || priority > 1) {
    return "Приоритет в карте сайта должен быть от 0 до 1.";
  }

  return null;
}

export async function PATCH(request: Request, { params }: SeoParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const item = readSeoBody(body);
  const error = validateSeo(item);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const [updatedPage] = await db
    .update(seoPages)
    .set({
      ...item,
      updatedAt: new Date(),
    })
    .where(eq(seoPages.id, id))
    .returning();

  return NextResponse.json(updatedPage);
}

export async function DELETE(_request: Request, { params }: SeoParams) {
  const { id } = await params;

  await db.delete(seoPages).where(eq(seoPages.id, id));

  return NextResponse.json({ success: true });
}
