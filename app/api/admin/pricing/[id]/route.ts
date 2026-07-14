import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { pricingItems } from "@/src/db/schema";

type PricingParams = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(request: Request, { params }: PricingParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const item = readPricingBody(body);

  if (!item.title || !item.consultationType || !item.format || !item.duration || !item.description || item.price <= 0) {
    return NextResponse.json(
      { error: "Заполните вид консультации, формат, длительность, описание и цену." },
      { status: 400 }
    );
  }

  const [updatedItem] = await db
    .update(pricingItems)
    .set({
      ...item,
      updatedAt: new Date(),
    })
    .where(eq(pricingItems.id, id))
    .returning();
  revalidatePath("/");

  return NextResponse.json(updatedItem);
}

export async function DELETE(_request: Request, { params }: PricingParams) {
  const { id } = await params;

  await db.delete(pricingItems).where(eq(pricingItems.id, id));
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
