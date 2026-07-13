import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  userConsultationPackages,
  users,
} from "@/src/db/schema";
import {
  createSlotDate,
  getAvailableAppointmentSlots,
} from "@/src/lib/appointment-slots";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";
import { notifyOwnerNewAppointment } from "@/src/lib/telegram";
import { createYooKassaPayment, isYooKassaConfigured } from "@/src/lib/yookassa";

const paymentMethods = new Set(["package", "online", "after_confirmation"]);

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession(
    request.cookies.get(USER_COOKIE_NAME)?.value
  );

  if (!userId) {
    return NextResponse.json({ error: "Войдите в кабинет." }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  if (body.legalConsent !== true) {
    return NextResponse.json(
      { error: "Подтвердите согласие с правовыми документами." },
      { status: 400 }
    );
  }

  const consultationFormat = String(body.consultationFormat ?? "online").trim();
  const appointmentDate = String(body.appointmentDate ?? "").trim();
  const appointmentTime = String(body.appointmentTime ?? "").trim();
  const paymentMethod = String(body.paymentMethod ?? "online").trim();
  const packageId = String(body.packageId ?? "").trim() || null;
  const message =
    String(body.message ?? "").trim() || "Запись из личного кабинета.";

  if (!["online", "office"].includes(consultationFormat)) {
    return NextResponse.json(
      { error: "Выберите формат консультации." },
      { status: 400 }
    );
  }

  if (!appointmentDate || !appointmentTime) {
    return NextResponse.json(
      { error: "Выберите дату и свободное время." },
      { status: 400 }
    );
  }

  if (!paymentMethods.has(paymentMethod)) {
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

  const contact = user.phone || user.telegram || user.email;

  const createdAppointment = await db.transaction(async (tx) => {
    let selectedPackageId: string | null = null;

    if (paymentMethod === "package") {
      if (!packageId) {
        throw new Error("Выберите активный пакет.");
      }

      const [activePackage] = await tx
        .select()
        .from(userConsultationPackages)
        .where(
          and(
            eq(userConsultationPackages.id, packageId),
            eq(userConsultationPackages.userId, userId),
            eq(userConsultationPackages.status, "active"),
            eq(userConsultationPackages.consultationFormat, consultationFormat)
          )
        )
        .limit(1);

      if (!activePackage || activePackage.remainingSessions <= 0) {
        throw new Error("В выбранном пакете больше нет доступных консультаций.");
      }

      selectedPackageId = activePackage.id;

      await tx
        .update(userConsultationPackages)
        .set({
          remainingSessions: activePackage.remainingSessions - 1,
          status:
            activePackage.remainingSessions - 1 > 0 ? "active" : "used",
          updatedAt: new Date(),
        })
        .where(eq(userConsultationPackages.id, activePackage.id));
    }

    const [appointment] = await tx
      .insert(appointmentRequests)
      .values({
        userId,
        packageId: selectedPackageId,
        name: user.name,
        contact,
        contactMethod: user.preferredContact,
        consultationFormat,
        preferredTime: `${appointmentDate} ${appointmentTime}`,
        message,
        scheduledAt,
        status: "scheduled",
        paymentMethod,
        paymentStatus: paymentMethod === "package" ? "paid" : paymentMethod === "online" ? "waiting" : "not_required",
        paymentNote:
          paymentMethod === "package"
            ? "Списана 1 консультация из оплаченного пакета."
            : null,
        notificationStatus: "not_sent",
      })
      .returning();

    await tx.insert(appointmentHistory).values({
      appointmentId: appointment.id,
      action: "Запись из кабинета",
      details:
        paymentMethod === "package"
          ? "Клиент записался и использовал 1 консультацию из пакета."
          : "Клиент записался из личного кабинета.",
    });

    return appointment;
  }).catch((error: unknown) => {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "Не удалось создать запись." };
  });

  if ("error" in createdAppointment) {
    return NextResponse.json({ error: createdAppointment.error }, { status: 400 });
  }

  let paymentUrl: string | null = null;

  if (paymentMethod === "online" && isYooKassaConfigured()) {
    try {
      const payment = await createYooKassaPayment({
        appointmentId: createdAppointment.id,
        name: user.name,
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
        .where(eq(appointmentRequests.id, createdAppointment.id));
    } catch (paymentError) {
      await db.insert(appointmentHistory).values({
        appointmentId: createdAppointment.id,
        action: "Оплата",
        details:
          paymentError instanceof Error
            ? paymentError.message
            : "Не удалось создать платеж ЮKassa.",
      });
    }
  }

  const telegramResult = await notifyOwnerNewAppointment({
    ...createdAppointment,
    message,
  });

  await db.insert(appointmentHistory).values({
    appointmentId: createdAppointment.id,
    action: "Telegram",
    details: telegramResult.ok
      ? "Владельцу отправлено уведомление о новой записи из кабинета."
      : telegramResult.reason,
  });

  return NextResponse.json(
    { ...createdAppointment, paymentUrl },
    { status: 201 }
  );
}
