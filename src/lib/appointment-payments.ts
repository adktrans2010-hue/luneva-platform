import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  consultationProducts,
  yookassaPayments,
} from "@/src/db/schema";
import {
  createProductSnapshot,
  getDefaultPublicProduct,
  getProductPaymentAmountKopeks,
} from "@/src/lib/consultation-products";
import { createYooKassaPayment } from "@/src/lib/yookassa";

type AppointmentPaymentSource = "public_booking" | "account_booking" | "admin";

type AppointmentLike = typeof appointmentRequests.$inferSelect;
type ProductLike = typeof consultationProducts.$inferSelect;

const reusablePaymentStatuses = ["creating", "waiting", "invoice_sent"];

function amountKopeksToRub(amountKopeks: number) {
  return Math.round(amountKopeks) / 100;
}

function canCreatePayment(appointment: AppointmentLike) {
  if (appointment.status === "cancelled") {
    return "Нельзя создать платеж для отмененной записи.";
  }

  if (appointment.paymentStatus === "paid") {
    return "Запись уже оплачена.";
  }

  if (
    ["partially_refunded", "refund_pending", "refunded"].includes(
      appointment.paymentStatus
    )
  ) {
    return "По записи уже оформлен возврат. Создайте новую запись или измените статус вручную.";
  }

  return null;
}

export async function createOrReuseAppointmentPayment({
  appointment,
  product,
  preferredFormat,
  source,
}: {
  appointment: AppointmentLike;
  product?: ProductLike;
  preferredFormat?: string;
  source: AppointmentPaymentSource;
}) {
  const blockedReason = canCreatePayment(appointment);

  if (blockedReason) {
    throw new Error(blockedReason);
  }

  const paymentProduct = product ?? (await getDefaultPublicProduct());
  const snapshot = createProductSnapshot(paymentProduct);
  const amountKopeks = getProductPaymentAmountKopeks(paymentProduct);

  const reusablePayments = await db
    .select()
    .from(yookassaPayments)
    .where(
      and(
        eq(yookassaPayments.appointmentId, appointment.id),
        eq(yookassaPayments.amountKopeks, amountKopeks),
        eq(yookassaPayments.currency, "RUB"),
        eq(yookassaPayments.productCodeSnapshot, snapshot.productCodeSnapshot),
        inArray(yookassaPayments.status, reusablePaymentStatuses)
      )
    )
    .orderBy(desc(yookassaPayments.createdAt))
    .limit(1);
  const existingPayment = reusablePayments[0];

  if (existingPayment?.confirmationUrl) {
    await db.insert(appointmentHistory).values({
      appointmentId: appointment.id,
      action: "ЮKassa",
      details: "Повторный запрос оплаты: использована уже созданная ссылка.",
    });

    return {
      localPaymentId: existingPayment.id,
      providerPaymentId: existingPayment.providerPaymentId,
      status: existingPayment.status,
      amountRub: amountKopeksToRub(existingPayment.amountKopeks),
      amountKopeks: existingPayment.amountKopeks,
      paymentUrl: existingPayment.confirmationUrl,
      reused: true,
    };
  }

  const [localPayment] = await db
    .insert(yookassaPayments)
    .values({
      appointmentId: appointment.id,
      productId: snapshot.productId,
      productCodeSnapshot: snapshot.productCodeSnapshot,
      productNameSnapshot: snapshot.productNameSnapshot,
      sessionsCountSnapshot: snapshot.sessionsCountSnapshot,
      priceKopeksSnapshot: snapshot.priceKopeksSnapshot,
      currencySnapshot: snapshot.currencySnapshot,
      durationMinutesSnapshot: snapshot.durationMinutesSnapshot,
      receiptDescriptionSnapshot: snapshot.receiptDescriptionSnapshot,
      idempotenceKey: randomUUID(),
      amountKopeks,
      currency: snapshot.currencySnapshot,
      status: "creating",
    })
    .returning();

  const startedAt = Date.now();

  try {
    const payment = await createYooKassaPayment({
      appointmentId: appointment.id,
      internalPaymentId: localPayment.id,
      name: appointment.name,
      contact: appointment.contact,
      scheduledAt: appointment.scheduledAt,
      amountKopeks,
      productSnapshot: snapshot,
      preferredFormat: preferredFormat ?? appointment.consultationFormat,
      idempotenceKey: localPayment.idempotenceKey,
    });

    const [updatedPayment] = await db
      .update(yookassaPayments)
      .set({
        providerPaymentId: payment.id,
        providerStatus: payment.providerStatus,
        status: payment.status,
        confirmationUrl: payment.paymentUrl,
        updatedAt: new Date(),
      })
      .where(eq(yookassaPayments.id, localPayment.id))
      .returning();

    await db
      .update(appointmentRequests)
      .set({
        paymentMethod: "online",
        yookassaPaymentId: payment.id,
        paymentAmount: payment.amountRub,
        paymentStatus: payment.status,
        paymentLink: payment.paymentUrl,
        notificationStatus: payment.paymentUrl ? "sent" : "not_sent",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(appointmentRequests.id, appointment.id),
          ne(appointmentRequests.status, "cancelled")
        )
      );

    await db.insert(appointmentHistory).values({
      appointmentId: appointment.id,
      action: "ЮKassa",
      details: `Создан платеж: ${payment.status}. Источник: ${source}. Время: ${
        Date.now() - startedAt
      } мс.`,
    });

    return {
      localPaymentId: updatedPayment?.id ?? localPayment.id,
      providerPaymentId: payment.id,
      status: payment.status,
      amountRub: payment.amountRub,
      amountKopeks: payment.amountKopeks,
      paymentUrl: payment.paymentUrl,
      reused: false,
    };
  } catch (error) {
    await db
      .update(yookassaPayments)
      .set({
        status: "failed",
        errorCode: error instanceof Error ? error.message.slice(0, 240) : "unknown",
        updatedAt: new Date(),
      })
      .where(eq(yookassaPayments.id, localPayment.id));

    await db.insert(appointmentHistory).values({
      appointmentId: appointment.id,
      action: "ЮKassa",
      details:
        error instanceof Error
          ? `Ошибка создания платежа: ${error.message}`
          : "Ошибка создания платежа.",
    });

    throw error;
  }
}
