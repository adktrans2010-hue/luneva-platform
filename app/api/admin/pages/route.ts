import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { sitePages } from "@/src/db/schema";
import { normalizePath } from "@/src/lib/seo";

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
  if (!/^\/[^/\s?#]+(?:\/[^/\s?#]+)*$/u.test(page.path)) {
    return "Укажите адрес страницы, например /cooperation.";
  }
  if (isReservedPath(page.path)) {
    return "Этот адрес зарезервирован системой.";
  }
  if (!page.title || !page.intro || !page.content) {
    return "Заполните заголовок, вступление и содержимое страницы.";
  }
  return null;
}

export async function GET() {
  return NextResponse.json(
    await db.select().from(sitePages).orderBy(asc(sitePages.path))
  );
}

export async function POST(request: Request) {
  const page = readPageBody(
    (await request.json()) as Record<string, unknown>
  );
  const error = validatePage(page);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const [created] = await db.insert(sitePages).values(page).returning();
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Страница с таким адресом уже существует." },
      { status: 409 }
    );
  }
}
