import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  consultationProducts,
  paymentEvents,
  yookassaPayments,
} from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";

type ProductRouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function toKopeks(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

function readProductBody(body: Record<string, unknown>) {
  return {
    code: String(body.code ?? "").trim(),
    name: String(body.name ?? "").trim(),
    shortDescription: String(body.shortDescription ?? "").trim() || null,
    fullDescription: String(body.fullDescription ?? "").trim() || null,
    sessionsCount: Number(body.sessionsCount ?? 1),
    priceKopeks: toKopeks(body.priceRub),
    currency: "RUB",
    durationMinutes: Number(body.durationMinutes ?? 50),
    isActive: Boolean(body.isActive),
    isPublic: Boolean(body.isPublic),
    sortOrder: Number(body.sortOrder ?? 0) || 0,
    badge: String(body.badge ?? "").trim() || null,
    oldPriceKopeks: body.oldPriceRub ? toKopeks(body.oldPriceRub) : null,
    receiptDescription: String(body.receiptDescription ?? "").trim() || null,
    paymentSubject: String(body.paymentSubject ?? "").trim() || null,
    paymentMode: String(body.paymentMode ?? "").trim() || null,
    vatCode: body.vatCode ? Number(body.vatCode) : null,
    updatedAt: new Date(),
  };
}

function validateProduct(product: ReturnType<typeof readProductBody>) {
  if (!product.code || !product.name) return "Укажите код и название продукта.";
  if (!/^[a-z0-9-]+$/.test(product.code)) {
    return "Код может содержать только латинские буквы, цифры и дефисы.";
  }
  if (!Number.isInteger(product.sessionsCount) || product.sessionsCount <= 0) {
    return "Количество консультаций должно быть положительным целым числом.";
  }
  if (!Number.isInteger(product.priceKopeks) || product.priceKopeks <= 0) {
    return "Стоимость должна быть больше нуля.";
  }
  if (!Number.isInteger(product.durationMinutes) || product.durationMinutes <= 0) {
    return "Длительность должна быть положительным числом минут.";
  }

  return null;
}

export async function PATCH(request: Request, { params }: ProductRouteParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const product = readProductBody(body);
  const validationError = validateProduct(product);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const [currentProduct] = await db
    .select()
    .from(consultationProducts)
    .where(eq(consultationProducts.id, id))
    .limit(1);

  if (!currentProduct) {
    return NextResponse.json({ error: "Продукт не найден." }, { status: 404 });
  }

  try {
    const [updatedProduct] = await db
      .update(consultationProducts)
      .set(product)
      .where(eq(consultationProducts.id, id))
      .returning();

    if (currentProduct.priceKopeks !== product.priceKopeks) {
      await db.insert(paymentEvents).values({
        eventType: "product.price_changed",
        amountKopeks: product.priceKopeks,
        source: "admin",
        actorId: admin.session.email,
        metadata: {
          productId: id,
          oldPriceKopeks: currentProduct.priceKopeks,
          newPriceKopeks: product.priceKopeks,
        },
      });
    }

    return NextResponse.json(updatedProduct);
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить продукт. Проверьте уникальность кода." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: ProductRouteParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const { id } = await params;
  const payments = await db
    .select({ id: yookassaPayments.id })
    .from(yookassaPayments)
    .where(eq(yookassaPayments.productId, id))
    .limit(1);

  if (payments.length > 0) {
    const [archivedProduct] = await db
      .update(consultationProducts)
      .set({
        isActive: false,
        isPublic: false,
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(consultationProducts.id, id))
      .returning();

    await db.insert(paymentEvents).values({
      eventType: "product.archived",
      source: "admin",
      actorId: admin.session.email,
      metadata: { productId: id, reason: "has_payments" },
    });

    return NextResponse.json(archivedProduct);
  }

  await db.delete(consultationProducts).where(eq(consultationProducts.id, id));

  await db.insert(paymentEvents).values({
    eventType: "product.deleted",
    source: "admin",
    actorId: admin.session.email,
    metadata: { productId: id },
  });

  return NextResponse.json({ success: true });
}
