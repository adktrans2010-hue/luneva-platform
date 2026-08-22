import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentRequests, consultationProducts } from "@/src/db/schema";
import { createOrReuseAppointmentPayment } from "@/src/lib/appointment-payments";
import type { PromotionQuote } from "@/src/lib/consultation-promotions";

function authorized(request: Request) {
  const expected = process.env.TELEGRAM_INTERNAL_API_SECRET ?? "";
  const supplied = request.headers.get("x-telegram-internal-secret") ?? "";
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { appointment_id?: string } | null;
  if (!body?.appointment_id) {
    return NextResponse.json({ error: "Некорректная запись." }, { status: 400 });
  }
  const [appointment] = await db.select().from(appointmentRequests).where(eq(appointmentRequests.id, body.appointment_id)).limit(1);
  if (!appointment?.productId) {
    return NextResponse.json({ error: "Запись не найдена." }, { status: 404 });
  }
  const [product] = await db.select().from(consultationProducts).where(eq(consultationProducts.id, appointment.productId)).limit(1);
  if (!product) return NextResponse.json({ error: "Услуга не найдена." }, { status: 404 });

  const basePriceKopeks = appointment.basePriceKopeksSnapshot ?? product.priceKopeks;
  const finalPriceKopeks = appointment.finalPriceKopeksSnapshot ?? basePriceKopeks;
  const quote: PromotionQuote = {
    code: appointment.promoCodeSnapshot,
    campaign: appointment.campaignSnapshot,
    basePriceKopeks,
    discountKopeks: appointment.discountKopeksSnapshot,
    finalPriceKopeks,
    applied: finalPriceKopeks < basePriceKopeks,
    message: null,
  };
  try {
    const payment = await createOrReuseAppointmentPayment({ appointment, product, promotionQuote: quote, source: "telegram" });
    return NextResponse.json({ payment_url: payment.paymentUrl, payment_status: payment.status, final_price: payment.amountRub, currency: "RUB", reused: payment.reused });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось создать оплату." }, { status: 400 });
  }
}
