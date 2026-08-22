import { NextResponse } from "next/server";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests, users } from "@/src/db/schema";
import { classifyAppointmentPreparationError } from "@/src/lib/appointment-api-errors";
import {
  createSlotDate,
  getAvailableAppointmentSlots,
} from "@/src/lib/appointment-slots";
import { createOrReuseAppointmentPayment } from "@/src/lib/appointment-payments";
import {
  findPurchasableProduct,
  normalizeConsultationFormat,
} from "@/src/lib/consultation-products";
import { resolvePromotionQuote } from "@/src/lib/consultation-promotions";
import { normalizeConsultationLocation } from "@/src/lib/consultation-locations";
import {
  checkPublicFormSpam,
  getSpamErrorMessage,
} from "@/src/lib/spam-protection";
import { sanitizeAttributionPayload } from "@/src/lib/attribution";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";
import { isYooKassaConfigured } from "@/src/lib/yookassa";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readSessionCookie(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${USER_COOKIE_NAME}=`))
    ?.replace(`${USER_COOKIE_NAME}=`, "");
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizePhone(value: unknown) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return "";
}

function getHoldMinutes() {
  const value = Number(process.env.PAYMENT_SLOT_HOLD_MINUTES ?? 15);
  return Number.isFinite(value) && value >= 5 && value <= 30 ? value : 15;
}

function safeAppointmentError(error: unknown) {
  if (error instanceof Error) {
    const expectedMessages = [
      "Это время уже занято",
      "Выберите другой вариант",
      "Выберите корректную дату",
    ];

    if (expectedMessages.some((message) => error.message.includes(message))) {
      return error.message;
    }

    console.error("appointment_create_failed", error);
  }

  return "Не удалось создать запись. Пожалуйста, попробуйте ещё раз или напишите Александре напрямую.";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let product;

  try {
    product = await findPurchasableProduct({
      productCode: searchParams.get("productCode"),
      publicPurchase: true,
    });
  } catch (error) {
    const response = classifyAppointmentPreparationError(error, "product");
    if (response.status === 503) console.error("product_lookup_failed", error);
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    const quote = await resolvePromotionQuote(product, searchParams.get("promo"));

    return NextResponse.json(quote);
  } catch (error) {
    console.error("promotion_quote_failed", error);
    const response = classifyAppointmentPreparationError(error, "quote");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Не удалось прочитать заявку. Попробуйте отправить форму еще раз." },
      { status: 400 }
    );
  }

  const email = normalizeEmail(body.email ?? body.contact);
  const name = normalizeName(body.name);
  const phone = normalizePhone(body.phone);
  const consultationFormat = normalizeConsultationFormat(
    body.preferredFormat ?? body.consultationFormat
  );
  const consultationLocation = normalizeConsultationLocation(
    consultationFormat,
    body.consultationLocation
  );
  const appointmentDate = String(body.appointmentDate ?? "").trim();
  const appointmentTime = String(body.appointmentTime ?? "").trim();
  const legalConsent = body.legalConsent === true;
  const attribution = sanitizeAttributionPayload(body.attribution);

  if (!legalConsent) {
    return NextResponse.json(
      { error: "Подтвердите согласие с правовыми документами." },
      { status: 400 }
    );
  }

  const spamReason = await checkPublicFormSpam({
    body,
    request,
    scope: "appointments",
    limit: 5,
    windowMs: 1000 * 60 * 15,
    minFillMs: 3000,
  });

  if (spamReason) {
    return NextResponse.json(
      { error: getSpamErrorMessage(spamReason) },
      { status: spamReason === "rate" ? 429 : 400 }
    );
  }

  if (!email || email.length > 320 || !emailPattern.test(email)) {
    return NextResponse.json(
      { error: "Укажите корректный email для чека и подтверждения записи." },
      { status: 400 }
    );
  }

  if (!name || name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Укажите имя для записи и оплаты." },
      { status: 400 }
    );
  }

  if (!phone) {
    return NextResponse.json(
      { error: "Укажите корректный номер телефона." },
      { status: 400 }
    );
  }

  if (!appointmentDate || !appointmentTime || !consultationLocation) {
    return NextResponse.json(
      { error: "Выберите услугу, формат, дату и свободное время." },
      { status: 400 }
    );
  }

  if (!isYooKassaConfigured()) {
    return NextResponse.json(
      { error: "Онлайн-оплата временно недоступна. Попробуйте позже." },
      { status: 503 }
    );
  }

  let product;
  let promotionQuote;

  try {
    product = await findPurchasableProduct({
      productId: String(body.productId ?? "").trim() || null,
      productCode: String(body.productCode ?? "").trim() || null,
      publicPurchase: true,
    });
  } catch (error) {
    const response = classifyAppointmentPreparationError(error, "product");
    if (response.status === 503) console.error("product_lookup_failed", error);
    return NextResponse.json(response.body, { status: response.status });
  }

  try {
    promotionQuote = await resolvePromotionQuote(product, body.promoCode);
  } catch (error) {
    console.error("promotion_quote_failed", error);
    const response = classifyAppointmentPreparationError(error, "quote");
    return NextResponse.json(response.body, { status: response.status });
  }

  const availableSlots = await getAvailableAppointmentSlots(
    appointmentDate,
    consultationFormat,
    consultationLocation
  );

  if (!availableSlots.includes(appointmentTime)) {
    return NextResponse.json(
      { error: "Это время уже занято. Выберите другой вариант." },
      { status: 409 }
    );
  }

  const scheduledAt = createSlotDate(appointmentDate, appointmentTime);

  if (!scheduledAt) {
    return NextResponse.json(
      { error: "Выберите корректную дату и время." },
      { status: 400 }
    );
  }

  const sessionUserId = await getUserIdFromSession(readSessionCookie(request));
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const userId = sessionUserId ?? existingUser?.id ?? null;
  const holdExpiresAt = new Date(Date.now() + getHoldMinutes() * 60 * 1000);

  const createdRequest = await db
    .transaction(async (tx) => {
      const compatibleFormats =
        consultationFormat === "in_person"
          ? ["in_person", "office"]
          : [consultationFormat];
      const lockKey = `${consultationFormat}:${consultationLocation}:${scheduledAt.toISOString()}`;

      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);

      const [busyAppointment] = await tx
        .select({
          id: appointmentRequests.id,
          status: appointmentRequests.status,
          holdExpiresAt: appointmentRequests.holdExpiresAt,
        })
        .from(appointmentRequests)
        .where(
          and(
            eq(appointmentRequests.scheduledAt, scheduledAt),
            inArray(appointmentRequests.consultationFormat, compatibleFormats),
            eq(appointmentRequests.consultationLocation, consultationLocation),
            ne(appointmentRequests.status, "cancelled"),
            ne(appointmentRequests.status, "expired")
          )
        )
        .limit(1);

      if (
        busyAppointment &&
        !(
          busyAppointment.status === "awaiting_payment" &&
          busyAppointment.holdExpiresAt &&
          busyAppointment.holdExpiresAt <= new Date()
        )
      ) {
        throw new Error("Это время уже занято. Выберите другой вариант.");
      }

      const [appointment] = await tx
        .insert(appointmentRequests)
        .values({
          userId,
          productId: product.id,
          name,
          contact: email,
          normalizedEmail: email,
          contactMethod: "email",
          consultationFormat,
          consultationLocation,
          preferredTime: `${appointmentDate} ${appointmentTime}`,
          message: `Запись через форму сайта. Телефон: ${phone}`,
          scheduledAt,
          status: "awaiting_payment",
          holdExpiresAt,
          paymentMethod: "online",
          paymentStatus: "waiting",
          paymentAmount: promotionQuote.finalPriceKopeks / 100,
          paymentNote: `${product.name}: ${product.sessionsCount} консультаций`,
          attribution,
          promoCodeSnapshot: promotionQuote.applied ? promotionQuote.code : null,
          campaignSnapshot: promotionQuote.applied ? promotionQuote.campaign : null,
          basePriceKopeksSnapshot: promotionQuote.basePriceKopeks,
          discountKopeksSnapshot: promotionQuote.discountKopeks,
          finalPriceKopeksSnapshot: promotionQuote.finalPriceKopeks,
          notificationStatus: "not_sent",
        })
        .returning();

      return appointment;
    })
    .catch((error: unknown) => ({
      error: safeAppointmentError(error),
    }));

  if ("error" in createdRequest) {
    return NextResponse.json({ error: createdRequest.error }, { status: 409 });
  }

  try {
    const payment = await createOrReuseAppointmentPayment({
      appointment: createdRequest,
      product,
      promotionQuote,
      preferredFormat: consultationFormat,
      source: "public_booking",
    });

    await db.insert(appointmentHistory).values({
      appointmentId: createdRequest.id,
      action: "Онлайн-запись",
      details: `Слот зарезервирован до ${holdExpiresAt.toLocaleString(
        "ru-RU"
      )}. Подтверждение произойдет только после payment.succeeded.`,
    });

    return NextResponse.json(
      {
        appointmentId: createdRequest.id,
        paymentUrl: payment.paymentUrl,
        paymentId: payment.localPaymentId,
        holdExpiresAt,
      },
      { status: 201 }
    );
  } catch (paymentError) {
    await db
      .update(appointmentRequests)
      .set({
        status: "expired",
        paymentStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(appointmentRequests.id, createdRequest.id));

    await db.insert(appointmentHistory).values({
      appointmentId: createdRequest.id,
      action: "Оплата",
      details:
        paymentError instanceof Error
          ? paymentError.message
          : "Не удалось создать платеж YooKassa.",
    });

    return NextResponse.json(
      { error: "Не удалось создать оплату. Попробуйте выбрать время еще раз." },
      { status: 500 }
    );
  }
}
