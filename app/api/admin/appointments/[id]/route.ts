import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  userConsultationPackages,
} from "@/src/db/schema";
import { notifyOwnerAppointmentChanged, notifyOwnerPayment } from "@/src/lib/telegram";

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
  "paid",
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
  paid: "Оплачено",
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

  const [updatedRequest] = await db
    .update(appointmentRequests)
    .set({
      status,
      scheduledAt,
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

  if (timeChanged || statusChanged) {
    const telegramResult = await notifyOwnerAppointmentChanged({
      appointment: updatedRequest,
      status,
      dateChanged: timeChanged,
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

  return NextResponse.json(updatedRequest);
}

export async function DELETE(_request: Request, { params }: AppointmentParams) {
  const { id } = await params;

  await db.delete(appointmentRequests).where(eq(appointmentRequests.id, id));

  return NextResponse.json({ success: true });
}
