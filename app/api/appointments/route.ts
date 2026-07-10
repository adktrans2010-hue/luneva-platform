import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";
import {
  createSlotDate,
  getAvailableAppointmentSlots,
} from "@/src/lib/appointment-slots";
import { notifyOwnerNewAppointment } from "@/src/lib/telegram";
import { createYooKassaPayment, isYooKassaConfigured } from "@/src/lib/yookassa";

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

  const name = String(body.name ?? "").trim();
  const contact = String(body.contact ?? "").trim();
  const consultationFormat = String(body.consultationFormat ?? "online").trim();
  const appointmentDate = String(body.appointmentDate ?? "").trim();
  const appointmentTime = String(body.appointmentTime ?? "").trim();
  const paymentMethod = String(body.paymentMethod ?? "online").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !contact || !appointmentDate || !appointmentTime || !message) {
    return NextResponse.json(
      { error: "Заполните имя, контакт, дату, время и запрос." },
      { status: 400 }
    );
  }

  if (!["online", "office"].includes(consultationFormat)) {
    return NextResponse.json(
      { error: "Выберите формат консультации." },
      { status: 400 }
    );
  }

  if (!["online", "after_confirmation"].includes(paymentMethod)) {
    return NextResponse.json(
      { error: "Выберите способ оплаты." },
      { status: 400 }
    );
  }

  const availableSlots = await getAvailableAppointmentSlots(
    appointmentDate,
    consultationFormat
  );

  if (!availableSlots.includes(appointmentTime)) {
    return NextResponse.json(
      { error: "Это время уже занято. Выберите другое свободное окно." },
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

  const [createdRequest] = await db
    .insert(appointmentRequests)
    .values({
      name,
      contact,
      contactMethod: "contact",
      consultationFormat,
      preferredTime: `${appointmentDate} ${appointmentTime}`,
      message,
      scheduledAt,
      status: "scheduled",
      paymentMethod,
      paymentStatus: paymentMethod === "online" ? "waiting" : "not_required",
      notificationStatus: "not_sent",
    })
    .returning();

  let paymentUrl: string | null = null;

  if (paymentMethod === "online" && isYooKassaConfigured()) {
    try {
      const payment = await createYooKassaPayment({
        appointmentId: createdRequest.id,
        name,
        contact,
        scheduledAt,
      });

      paymentUrl = payment.paymentUrl;

      await db
        .update(appointmentRequests)
        .set({
          yookassaPaymentId: payment.id,
          paymentAmount: payment.amountRub,
          paymentStatus: payment.status,
          paymentLink: payment.paymentUrl,
          notificationStatus: payment.paymentUrl ? "sent" : "not_sent",
          updatedAt: new Date(),
        })
        .where(eq(appointmentRequests.id, createdRequest.id));
    } catch (paymentError) {
      await db.insert(appointmentHistory).values({
        appointmentId: createdRequest.id,
        action: "Оплата",
        details:
          paymentError instanceof Error
            ? paymentError.message
            : "Не удалось создать платеж ЮKassa.",
      });
    }
  }

  await db.insert(appointmentHistory).values({
    appointmentId: createdRequest.id,
    action: "Онлайн-запись",
    details: `Клиент выбрал ${scheduledAt.toLocaleString("ru-RU")}. Оплата: ${
      paymentMethod === "online" ? "онлайн" : "после подтверждения"
    }`,
  });

  const telegramResult = await notifyOwnerNewAppointment({
    ...createdRequest,
    message,
  });

  await db.insert(appointmentHistory).values({
    appointmentId: createdRequest.id,
    action: "Telegram",
    details: telegramResult.ok
      ? "Владельцу отправлено уведомление о новой записи."
      : telegramResult.reason,
  });

  return NextResponse.json({ ...createdRequest, paymentUrl }, { status: 201 });
}
