import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db } from "@/src/db";
import { faqItems } from "@/src/db/schema";

function readFaqBody(body: Record<string, unknown>) {
  return {
    question: String(body.question ?? "").trim(),
    answer: String(body.answer ?? "").trim(),
    category: String(body.category ?? "").trim() || null,
    published: Boolean(body.published),
    sortOrder: Number(body.sortOrder ?? 0) || 0,
  };
}

export async function GET() {
  return NextResponse.json(
    await db
      .select()
      .from(faqItems)
      .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt))
  );
}

export async function POST(request: Request) {
  const item = readFaqBody(
    (await request.json()) as Record<string, unknown>
  );
  if (!item.question || !item.answer) {
    return NextResponse.json(
      { error: "Заполните вопрос и ответ." },
      { status: 400 }
    );
  }

  const [created] = await db.insert(faqItems).values(item).returning();
  revalidatePath("/faq");
  return NextResponse.json(created, { status: 201 });
}
