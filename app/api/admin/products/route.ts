import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  consultationProducts,
  paymentEvents,
  yookassaPayments,
} from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";

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
  };
}

function validateProduct(product: ReturnType<typeof readProductBody>) {
  if (!product.code || !product.name) {
    return "Укажите код и название продукта.";
  }

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

export async function GET(request: Request) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const products = await db
    .select()
    .from(consultationProducts)
    .orderBy(asc(consultationProducts.sortOrder), asc(consultationProducts.createdAt));

  const rows = await Promise.all(
    products.map(async (product) => {
      const payments = await db
        .select({ id: yookassaPayments.id })
        .from(yookassaPayments)
        .where(eq(yookassaPayments.productId, product.id));

      return { ...product, purchasesCount: payments.length };
    })
  );

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const body = (await request.json()) as Record<string, unknown>;
  const product = readProductBody(body);
  const validationError = validateProduct(product);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const [createdProduct] = await db
      .insert(consultationProducts)
      .values(product)
      .returning();

    await db.insert(paymentEvents).values({
      eventType: "product.created",
      source: "admin",
      actorId: admin.session.email,
      metadata: { productId: createdProduct.id, productCode: createdProduct.code },
    });

    return NextResponse.json(createdProduct, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Не удалось создать продукт. Проверьте уникальность кода." },
      { status: 400 }
    );
  }
}
