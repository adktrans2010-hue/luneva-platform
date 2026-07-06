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

  const [updatedReview] = await db
    .update(reviews)
    .set({
      name: body.name,
      age: body.age,
      text: body.text,
      image: body.image,
      published: body.published,
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