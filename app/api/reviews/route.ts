import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { reviews } from "@/src/db/schema";

export async function GET() {
  const data = await db
    .select()
    .from(reviews)
    .where(eq(reviews.published, true))
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = String(body.name || "").trim();
  const age = body.age ? String(body.age).trim() : null;
  const text = String(body.text || "").trim();
  const image = body.image ? String(body.image).trim() : null;

  if (!name || !text) {
    return NextResponse.json(
      { error: "Имя и текст отзыва обязательны" },
      { status: 400 }
    );
  }

  const [createdReview] = await db
    .insert(reviews)
    .values({
      name,
      age,
      text,
      image,
      published: false,
    })
    .returning();

  return NextResponse.json(createdReview, { status: 201 });
}