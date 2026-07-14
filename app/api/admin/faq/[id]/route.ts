import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { db } from "@/src/db";
import { faqItems } from "@/src/db/schema";

type Params = { params: Promise<{ id: string }> };

function readFaqBody(body: Record<string, unknown>) {
  return {
    question: String(body.question ?? "").trim(),
    answer: String(body.answer ?? "").trim(),
    category: String(body.category ?? "").trim() || null,
    published: Boolean(body.published),
    sortOrder: Number(body.sortOrder ?? 0) || 0,
  };
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const item = readFaqBody(
    (await request.json()) as Record<string, unknown>
  );
  if (!item.question || !item.answer) {
    return NextResponse.json(
      { error: "Заполните вопрос и ответ." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(faqItems)
    .set({ ...item, updatedAt: new Date() })
    .where(eq(faqItems.id, id))
    .returning();
  revalidatePath("/faq");

  return updated
    ? NextResponse.json(updated)
    : NextResponse.json({ error: "Вопрос не найден." }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(faqItems).where(eq(faqItems.id, id));
  revalidatePath("/faq");
  return NextResponse.json({ success: true });
}
