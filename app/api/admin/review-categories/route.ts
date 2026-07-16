import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { reviewCategories } from "@/src/db/schema";

export async function GET() {
  const data = await db
    .select()
    .from(reviewCategories)
    .orderBy(asc(reviewCategories.sortOrder), asc(reviewCategories.name));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Введите название категории" }, { status: 400 });
  }

  try {
    const [createdCategory] = await db
      .insert(reviewCategories)
      .values({ name })
      .returning();

    return NextResponse.json(createdCategory, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Категория с таким названием уже существует" },
      { status: 409 }
    );
  }
}
