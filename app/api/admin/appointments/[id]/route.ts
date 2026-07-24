import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  userConsultationPackages,
} from "@/src/db/schema";
import {
  notifyOwnerAppointmentChanged,
  notifyOwnerAppointmentEvent,
  notifyOwnerPayment,
} from "@/src/lib/telegram";
import { createClientNotification } from "@/src/lib/client-notifications";
import {
  getConsultationPlaceLabel,
  normalizeConsultationLocation,
} from "@/src/lib/consultation-locations";

type AppointmentParams = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = new Set([
  "new",
  "scheduled",
  "completed",
  "cancelled",
]);

const allowedPaymentStatuses = new Set([
  "waiting",
  "invoice_sent",
  "waiting_for_capture",
  "paid",
  "partially_refunded",
  "refund_pending",
  "refund_failed",
  "manual_review",
  "cancelled",
  "refunded",
  "not_required",
]);

const allowedNotificationStatuses = new Set([
  "not_sent",
  "sent",
  "failed",
]);

const statusLabels: Record<string, string> = {
  new: "Новая",
  scheduled: "Запланирована",
  completed: "Проведена",
  cancelled: "Отменена",
};

const paymentStatusLabels: Record<string, string> = {
  waiting: "Ожидает оплаты",
  invoice_sent: "Ссылка отправлена",
  waiting_for_capture: "Ожидает подтверждения",
  paid: "Оплачено",
  partially_refunded: "Частичный возврат",
  refund_pending: "Возврат в обработке",
  refund_failed: "Ошибка возврата",
  manual_review: "Требует проверки",
  cancelled: "Отменено",
  refunded: "Возврат",
  not_required: "Без онлайн-оплаты",
};

const notificationStatusLabels: Record<string, string> = {
  not_sent: "Не отправлено",
  sent: "Отправлено",
  failed: "Ошибка отправки",
};

function readDate(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export async function PATCH(request: Request, { params }: AppointmentParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const status = String(body.status ?? "").trim();
  const scheduledAt = readDate(body.scheduledAt);
  const requestedConsultationLocation = body.consultationLocation;
  const notes = String(body.notes ?? "").trim() || null;
  const paymentStatus = String(body.paymentStatus ?? "").trim();
  const paymentLink = String(body.paymentLink ?? "").trim() || null;
  const paymentNote = String(body.paymentNote ?? "").trim() || null;
  const notificationStatus = String(body.notificationStatus ?? "").trim();

  if (!allowedStatuses.has(status)) {
    return NextResponse.json(
      { error: "Выберите корректный статус консультации." },
      { status: 400 }
    );
  }

  if (scheduledAt === undefined) {
    return NextResponse.json(
      { error: "Укажите корректную дату и время." },
      { status: 400 }
    );
  }

  if (!allowedPaymentStatuses.has(paymentStatus)) {
    return NextResponse.json(
      { error: "Выберите корректный статус оплаты." },
      { status: 400 }
    );
  }

  if (!allowedNotificationStatuses.has(notificationStatus)) {
    return NextResponse.json(
      { error: "Выберите корректный статус уведомления." },
      { status: 400 }
    );
  }

  const [currentRequest] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, id))
    .limit(1);

  if (!currentRequest) {
    return NextResponse.json({ error: "Заявка не найдена." }, { status: 404 });
  }

  const consultationLocation = normalizeConsultationLocation(
    currentRequest.consultationFormat,
    requestedConsultationLocation ?? currentRequest.consultationLocation
  );

  if (!consultationLocation) {
    return NextResponse.json(
      { error: "Выберите город очной консультации." },
      { status: 400 }
    );
  }

  const [updatedRequest] = await db
    .update(appointmentRequests)
    .set({
      status,
      scheduledAt,
      consultationLocation,
      notes,
      paymentStatus,
      paymentLink,
      paymentNote,
      notificationStatus,
      updatedAt: new Date(),
    })
    .where(eq(appointmentRequests.id, id))
    .returning();

  const previousTime = currentRequest.scheduledAt?.toISOString() ?? "";
  const nextTime = updatedRequest.scheduledAt?.toISOString() ?? "";
  const statusChanged = currentRequest.status !== updatedRequest.status;
  const timeChanged = previousTime !== nextTime;
  const locationChanged =
    currentRequest.consultationLocation !==
    updatedRequest.consultationLocation;
  const notesChanged = (currentRequest.notes ?? "") !== (updatedRequest.notes ?? "");
  const paymentChanged =
    currentRequest.paymentStatus !== updatedRequest.paymentStatus ||
    currentRequest.paymentLink !== updatedRequest.paymentLink;
  const notificationChanged =
    currentRequest.notificationStatus !== updatedRequest.notificationStatus;

  if (timeChanged) {
    const action = previousTime && nextTime ? "Перенос" : "Назначение";

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action,
      details: `${action}: ${
        updatedRequest.scheduledAt
          ? updatedRequest.scheduledAt.toLocaleString("ru-RU")
          : "без даты"
      }`,
    });
  }

  if (locationChanged) {
    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Место консультации",
      details: `Новое место: ${getConsultationPlaceLabel(
        updatedRequest.consultationFormat,
        updatedRequest.consultationLocation
      )}`,
    });
  }

  if (statusChanged) {
    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: status === "cancelled" ? "Отмена" : "Статус",
      details: `Статус: ${statusLabels[status]}`,
    });

    if (
      currentRequest.packageId &&
      currentRequest.status !== "cancelled" &&
      status === "cancelled"
    ) {
      const [currentPackage] = await db
        .select()
        .from(userConsultationPackages)
        .where(eq(userConsultationPackages.id, currentRequest.packageId))
        .limit(1);

      if (currentPackage) {
        await db
          .update(userConsultationPackages)
          .set({
            remainingSessions: currentPackage.remainingSessions + 1,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(userConsultationPackages.id, currentPackage.id));

        await db.insert(appointmentHistory).values({
          appointmentId: id,
          action: "Пакет",
          details:
            "Консультация возвращена в оплаченный пакет клиента после отмены записи.",
        });
      }
    }
  }

  if (notesChanged) {
    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Заметка",
      details: updatedRequest.notes ? "Заметка обновлена" : "Заметка очищена",
    });
  }

  if (paymentChanged) {
    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Оплата",
      details: `Статус: ${paymentStatusLabels[paymentStatus]}${
        paymentLink ? `. Ссылка: ${paymentLink}` : ""
      }`,
    });
  }

  if (notificationChanged) {
    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Уведомление",
      details: `Статус: ${notificationStatusLabels[notificationStatus]}`,
    });
  }

  if (updatedRequest.userId && (timeChanged || statusChanged || locationChanged)) {
    const changes: string[] = [];

    if (timeChanged) {
      changes.push(
        updatedRequest.scheduledAt
          ? `Новая дата и время: ${updatedRequest.scheduledAt.toLocaleString(
              "ru-RU"
            )}.`
          : "Дата консультации уточняется."
      );
    }

    if (locationChanged) {
      changes.push(
        `Место: ${getConsultationPlaceLabel(
          updatedRequest.consultationFormat,
          updatedRequest.consultationLocation
        )}.`
      );
    }

    if (statusChanged) {
      const clientStatusLabels: Record<string, string> = {
        new: "Новая",
        scheduled: "Запланирована",
        completed: "Проведена",
        cancelled: "Отменена",
      };
      changes.push(`Статус: ${clientStatusLabels[status] ?? status}.`);
    }

    await createClientNotification({
      userId: updatedRequest.userId,
      appointmentId: id,
      kind: "appointment_update",
      title: "Изменение записи",
      message: changes.join(" "),
    });
  }

  if (updatedRequest.userId && paymentChanged) {
    const clientPaymentLabels: Record<string, string> = {
      waiting: "Ожидает оплаты",
      invoice_sent: "Ссылка на оплату готова",
      waiting_for_capture: "Оплата ожидает подтверждения",
      paid: "Оплачено",
      partially_refunded: "Оформлен частичный возврат",
      refund_pending: "Возврат в обработке",
      refund_failed: "Возврат не выполнен",
      manual_review: "Оплата требует проверки",
      cancelled: "Оплата отменена",
      refunded: "Оформлен возврат",
      not_required: "Онлайн-оплата не требуется",
    };

    await createClientNotification({
      userId: updatedRequest.userId,
      appointmentId: id,
      kind: "payment",
      title: "Изменение оплаты",
      message: `${clientPaymentLabels[paymentStatus] ?? paymentStatus}.${
        paymentLink ? " Ссылка доступна в разделе оплаты." : ""
      }`,
    });
  }

  if (timeChanged || statusChanged || locationChanged) {
    const telegramResult = await notifyOwnerAppointmentChanged({
      appointment: updatedRequest,
      status,
      dateChanged: timeChanged,
      locationChanged,
    });

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Telegram",
      details: telegramResult.ok
        ? "Владельцу отправлено уведомление об изменении записи."
        : telegramResult.reason,
    });
  }

  if (paymentChanged) {
    const telegramResult = await notifyOwnerPayment(updatedRequest);

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Telegram",
      details: telegramResult.ok
        ? "Владельцу отправлено уведомление об оплате."
        : telegramResult.reason,
    });
  }

  if (notesChanged) {
    const telegramResult = await notifyOwnerAppointmentEvent({
      appointment: updatedRequest,
      title: "Заметка по консультации обновлена",
      details: updatedRequest.notes || "Заметка очищена",
    });

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Telegram",
      details: telegramResult.ok
        ? "Владельцу отправлено уведомление об изменении заметки."
        : telegramResult.reason,
    });
  }

  if (notificationChanged) {
    const telegramResult = await notifyOwnerAppointmentEvent({
      appointment: updatedRequest,
      title: "Изменен статус уведомления по консультации",
      details: `Статус: ${notificationStatusLabels[notificationStatus]}`,
    });

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Telegram",
      details: telegramResult.ok
        ? "Владельцу отправлено уведомление об изменении статуса уведомления."
        : telegramResult.reason,
    });
  }

  return NextResponse.json(updatedRequest);
}

export async function DELETE(_request: Request, { params }: AppointmentParams) {
  const { id } = await params;

  const [currentRequest] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, id))
    .limit(1);

  if (currentRequest) {
    await notifyOwnerAppointmentEvent({
      appointment: currentRequest,
      title: "Запись удалена из админки",
      details: "Запись удалена без сохранения в журнале консультаций.",
    });
  }

  await db.delete(appointmentRequests).where(eq(appointmentRequests.id, id));

  return NextResponse.json({ success: true });
}
