import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, ne, sql } from "drizzle-orm";

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
import { createClientNotification } from "@/src/lib/client-notifications";
import {
  getConsultationPlaceLabel,
  normalizeConsultationLocation,
} from "@/src/lib/consultation-locations";
import { createOrReuseAppointmentPayment } from "@/src/lib/appointment-payments";
import { isYooKassaConfigured } from "@/src/lib/yookassa";
import { hasPaymentCustomerContact } from "@/src/lib/payment-contact";
import { sanitizeAttributionPayload } from "@/src/lib/attribution";

const paymentMethods = new Set(["package", "online", "after_confirmation"]);

function safeAppointmentError(error: unknown) {
  if (error instanceof Error) {
    const expectedMessages = [
      "Это время уже занято",
      "Выберите другое свободное окно",
      "Выберите активный пакет",
      "В выбранном пакете больше нет",
    ];

    if (expectedMessages.some((message) => error.message.includes(message))) {
      return error.message;
    }

    console.error("account_appointment_create_failed", error);
  }

  return "Не удалось создать запись. Пожалуйста, попробуйте ещё раз или напишите Александре напрямую.";
}

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
    .where(
      and(
        eq(users.id, userId),
        eq(users.isBlocked, false),
        isNull(users.deletedAt)
      )
    )
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
  const consultationLocation = normalizeConsultationLocation(
    consultationFormat,
    body.consultationLocation
  );
  const appointmentDate = String(body.appointmentDate ?? "").trim();
  const appointmentTime = String(body.appointmentTime ?? "").trim();
  const paymentMethod = String(body.paymentMethod ?? "online").trim();
  const packageId = String(body.packageId ?? "").trim() || null;
  const message =
    String(body.message ?? "").trim() || "Запись из личного кабинета.";
  const attribution = sanitizeAttributionPayload(body.attribution);

  if (
    !["online", "office"].includes(consultationFormat) ||
    !consultationLocation
  ) {
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
    consultationFormat,
    consultationLocation
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

  if (paymentMethod === "online" && !hasPaymentCustomerContact(contact)) {
    return NextResponse.json(
      {
        error:
          "Для онлайн-оплаты добавьте в профиль email или номер телефона. Эти данные нужны для чека.",
      },
      { status: 400 }
    );
  }

  const createdAppointment = await db.transaction(async (tx) => {
    const lockKey = `${consultationFormat}:${consultationLocation}:${scheduledAt.toISOString()}`;

    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);

    const [busyAppointment] = await tx
      .select({ id: appointmentRequests.id })
      .from(appointmentRequests)
      .where(
        and(
          eq(appointmentRequests.scheduledAt, scheduledAt),
          eq(appointmentRequests.consultationFormat, consultationFormat),
          eq(
            appointmentRequests.consultationLocation,
            consultationLocation
          ),
          ne(appointmentRequests.status, "cancelled")
        )
      )
      .limit(1);

    if (busyAppointment) {
      throw new Error("Это время уже занято. Выберите другое свободное окно.");
    }

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
            eq(userConsultationPackages.status, "active")
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
          usedSessions: activePackage.usedSessions + 1,
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
        consultationLocation,
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
        attribution,
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
    return { error: safeAppointmentError(error) };
  });

  if ("error" in createdAppointment) {
    return NextResponse.json({ error: createdAppointment.error }, { status: 400 });
  }

  let appointmentForNotification = createdAppointment;
  let paymentUrl: string | null = null;

  if (paymentMethod === "online" && isYooKassaConfigured()) {
    try {
      const payment = await createOrReuseAppointmentPayment({
        appointment: createdAppointment,
        source: "account_booking",
      });

      paymentUrl = payment.paymentUrl;
      appointmentForNotification = {
        ...createdAppointment,
        yookassaPaymentId: payment.providerPaymentId,
        paymentAmount: payment.amountRub,
        paymentStatus: payment.status,
        paymentLink: payment.paymentUrl,
      };
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
    ...appointmentForNotification,
    message,
  });

  await db.insert(appointmentHistory).values({
    appointmentId: createdAppointment.id,
    action: "Telegram",
    details: telegramResult.ok
      ? "Владельцу отправлено уведомление о новой записи из кабинета."
      : telegramResult.reason,
  });

  await createClientNotification({
    userId,
    appointmentId: createdAppointment.id,
    kind: "booking",
    title: "Запись создана",
    message: `Консультация запланирована на ${scheduledAt.toLocaleString(
      "ru-RU"
    )}. Формат: ${getConsultationPlaceLabel(
      consultationFormat,
      consultationLocation
    )}.`,
  });

  return NextResponse.json(
    { ...createdAppointment, paymentUrl },
    { status: 201 }
  );
}
