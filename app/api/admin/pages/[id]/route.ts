import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { sitePages } from "@/src/db/schema";
import { normalizePath } from "@/src/lib/seo";

type Params = { params: Promise<{ id: string }> };
const reservedPrefixes = [
  "/admin", "/api", "/legal", "/account", "/blog", "/certificates",
  "/about", "/contacts", "/cookies", "/faq", "/forgot-password",
  "/help", "/login", "/register", "/reset-password", "/reviews",
  "/verify", "/videos",
];

function isReservedPath(path: string) {
  return reservedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function readPageBody(body: Record<string, unknown>) {
  return {
    path: normalizePath(String(body.path ?? "").trim()),
    eyebrow: String(body.eyebrow ?? "").trim() || null,
    title: String(body.title ?? "").trim(),
    intro: String(body.intro ?? "").trim(),
    content: String(body.content ?? "").trim(),
    published: Boolean(body.published),
  };
}

function validatePage(page: ReturnType<typeof readPageBody>) {
  if (!/^\/[^/\s?#]+(?:\/[^/\s?#]+)*$/u.test(page.path)) return "Укажите корректный адрес страницы.";
  if (isReservedPath(page.path)) return "Этот адрес зарезервирован системой.";
  if (!page.title || !page.intro || !page.content) return "Заполните все основные поля страницы.";
  return null;
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const page = readPageBody((await request.json()) as Record<string, unknown>);
  const error = validatePage(page);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const [updated] = await db
      .update(sitePages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(sitePages.id, id))
      .returning();
    return updated
      ? NextResponse.json(updated)
      : NextResponse.json({ error: "Страница не найдена." }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Страница с таким адресом уже существует." },
      { status: 409 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(sitePages).where(eq(sitePages.id, id));
  return NextResponse.json({ success: true });
}
