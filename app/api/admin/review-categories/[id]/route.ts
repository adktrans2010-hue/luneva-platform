import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { reviewCategories } from "@/src/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Введите название категории" }, { status: 400 });
  }

  try {
    const [updatedCategory] = await db
      .update(reviewCategories)
      .set({
        name,
        active: body.active !== false,
        sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0,
        updatedAt: new Date(),
      })
      .where(eq(reviewCategories.id, id))
      .returning();

    return NextResponse.json(updatedCategory);
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить категорию" },
      { status: 409 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.delete(reviewCategories).where(eq(reviewCategories.id, id));

  return NextResponse.json({ success: true });
}
