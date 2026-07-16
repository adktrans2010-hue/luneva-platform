import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { reviews } from "@/src/db/schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const rating = Number(body.rating);
  const createdAt = new Date(body.createdAt);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Некорректная оценка" }, { status: 400 });
  }

  if (Number.isNaN(createdAt.getTime())) {
    return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
  }

  const [updatedReview] = await db
    .update(reviews)
    .set({
      name: body.name,
      age: body.age,
      text: body.text,
      image: body.image,
      rating,
      categoryId: body.categoryId || null,
      published: body.published,
      createdAt,
    })
    .where(eq(reviews.id, id))
    .returning();

  return NextResponse.json(updatedReview);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.delete(reviews).where(eq(reviews.id, id));

  return NextResponse.json({ success: true });
}
