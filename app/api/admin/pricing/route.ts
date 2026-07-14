import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { asc } from "drizzle-orm";

import { db } from "@/src/db";
import { pricingItems } from "@/src/db/schema";

function readPricingBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim(),
    consultationType: String(body.consultationType ?? "").trim(),
    format: String(body.format ?? "").trim(),
    duration: String(body.duration ?? "").trim(),
    price: Number(body.price ?? 0),
    oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
    description: String(body.description ?? "").trim(),
    buttonText: String(body.buttonText ?? "Записаться").trim() || "Записаться",
    published: Boolean(body.published),
    sortOrder: Number(body.sortOrder ?? 0) || 0,
  };
}

export async function GET() {
  const data = await db
    .select()
    .from(pricingItems)
    .orderBy(asc(pricingItems.sortOrder), asc(pricingItems.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const item = readPricingBody(body);

  if (!item.title || !item.consultationType || !item.format || !item.duration || !item.description || item.price <= 0) {
    return NextResponse.json(
      { error: "Заполните вид консультации, формат, длительность, описание и цену." },
      { status: 400 }
    );
  }

  const [createdItem] = await db.insert(pricingItems).values(item).returning();
  revalidatePath("/");

  return NextResponse.json(createdItem, { status: 201 });
}
