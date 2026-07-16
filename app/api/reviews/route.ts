import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { reviews } from "@/src/db/schema";
import {
  checkPublicFormSpam,
  getSpamErrorMessage,
} from "@/src/lib/spam-protection";
import { notifyOwnerNewReview } from "@/src/lib/telegram";

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

  if (body.legalConsent !== true) {
    return NextResponse.json(
      { error: "Подтвердите согласие с правовыми документами." },
      { status: 400 }
    );
  }

  const spamReason = await checkPublicFormSpam({
    body,
    request,
    scope: "reviews",
    limit: 3,
    windowMs: 1000 * 60 * 10,
  });

  if (spamReason) {
    return NextResponse.json(
      { error: getSpamErrorMessage(spamReason) },
      { status: spamReason === "rate" ? 429 : 400 }
    );
  }

  const name = String(body.name || "").trim() || "Клиент";
  const age = body.age ? String(body.age).trim() : null;
  const text = String(body.text || "").trim();
  const image = body.image ? String(body.image).trim() : null;
  const rating = Number(body.rating);

  if (!text) {
    return NextResponse.json(
      { error: "Текст отзыва обязателен" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Выберите оценку от 1 до 5" },
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
      rating,
      published: false,
    })
    .returning();

  await notifyOwnerNewReview({ name, age, text, rating });

  return NextResponse.json(createdReview, { status: 201 });
}
