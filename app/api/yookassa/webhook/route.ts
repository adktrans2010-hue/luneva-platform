import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  paymentEvents,
  userConsultationPackages,
  yookassaPayments,
} from "@/src/db/schema";
import { notifyOwnerPayment } from "@/src/lib/telegram";
import { sendPaidAppointmentInvitation } from "@/src/lib/account-invitations";
import { syncRefund } from "@/src/lib/yookassa-refunds";
import {
  getYooKassaPayment,
  isYooKassaConfigured,
  mapYooKassaPaymentStatus,
  parseYooKassaAmountKopeks,
} from "@/src/lib/yookassa";

type YooKassaNotification = {
  event?: string;
  object?: {
    id?: string;
    metadata?: {
      appointmentId?: string;
      internalPaymentId?: string;
      productId?: string;
      productCode?: string;
    };
  };
};

function jsonOk() {
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let notification: YooKassaNotification;

  try {
    notification = (await request.json()) as YooKassaNotification;
  } catch {
    return jsonOk();
  }

  const providerPaymentId = notification.object?.id?.trim();
  const eventType = notification.event ?? "payment.updated";

  if (!providerPaymentId) {
    return jsonOk();
  }

  if (eventType.startsWith("refund.")) {
    try {
      await syncRefund(providerPaymentId, { source: "webhook" });
    } catch (error) {
      await db.insert(paymentEvents).values({
        eventType: "refund.manual_review",
        newStatus: "manual_review",
        source: "webhook",
        metadata: {
          providerRefundId: providerPaymentId,
          error: error instanceof Error ? error.message.slice(0, 240) : "unknown",
        },
      });

      console.warn("yookassa_refund_webhook_failed", {
        providerRefundId: providerPaymentId,
        eventType,
        duration: Date.now() - startedAt,
        httpStatus: 200,
      });
    }

    return jsonOk();
  }

  const [localPayment] = await db
    .select()
    .from(yookassaPayments)
    .where(
      and(
        eq(yookassaPayments.provider, "yookassa"),
        eq(yookassaPayments.providerPaymentId, providerPaymentId)
      )
    )
    .limit(1);

  if (!localPayment) {
    console.warn("yookassa_webhook_unknown_payment", {
      providerPaymentId,
      eventType,
      httpStatus: 200,
    });

    return jsonOk();
  }

  if (!isYooKassaConfigured()) {
    await db
      .update(yookassaPayments)
      .set({
        errorCode: "yookassa_not_configured",
        updatedAt: new Date(),
      })
      .where(eq(yookassaPayments.id, localPayment.id));

    return jsonOk();
  }

  let providerPayment: Awaited<ReturnType<typeof getYooKassaPayment>>;

  try {
    providerPayment = await getYooKassaPayment(providerPaymentId);
  } catch (error) {
    await db
      .update(yookassaPayments)
      .set({
        errorCode:
          error instanceof Error
            ? error.message.slice(0, 240)
            : "yookassa_status_request_failed",
        updatedAt: new Date(),
      })
      .where(eq(yookassaPayments.id, localPayment.id));

    return jsonOk();
  }

  const providerAppointmentId = providerPayment.metadata?.appointmentId;
  const providerInternalPaymentId = providerPayment.metadata?.internalPaymentId;
  const providerProductId = providerPayment.metadata?.productId;
  const providerProductCode = providerPayment.metadata?.productCode;
  const amountKopeks = parseYooKassaAmountKopeks(providerPayment.amount?.value);
  const currency = providerPayment.amount?.currency ?? "";
  const nextPaymentStatus = mapYooKassaPaymentStatus(providerPayment);
  const nextProviderStatus = providerPayment.status;

  const validationError =
    providerAppointmentId !== localPayment.appointmentId
      ? "appointment_mismatch"
      : providerInternalPaymentId &&
          providerInternalPaymentId !== localPayment.id
        ? "payment_mismatch"
        : localPayment.productId &&
            providerProductId &&
            providerProductId !== localPayment.productId
          ? "product_mismatch"
          : localPayment.productCodeSnapshot &&
              providerProductCode &&
              providerProductCode !== localPayment.productCodeSnapshot
            ? "product_code_mismatch"
            : amountKopeks !== localPayment.amountKopeks
              ? "amount_mismatch"
              : currency !== localPayment.currency
                ? "currency_mismatch"
                : null;

  if (validationError) {
    await db.transaction(async (tx) => {
      await tx
        .update(yookassaPayments)
        .set({
          providerStatus: nextProviderStatus,
          status: "validation_failed",
          errorCode: validationError,
          updatedAt: new Date(),
        })
        .where(eq(yookassaPayments.id, localPayment.id));

      await tx.insert(appointmentHistory).values({
        appointmentId: localPayment.appointmentId,
        action: "ЮKassa",
        details: `Webhook отклонен: ${validationError}.`,
      });
    });

    console.warn("yookassa_webhook_validation_failed", {
      providerPaymentId,
      appointmentId: localPayment.appointmentId,
      eventType,
      errorCode: validationError,
      duration: Date.now() - startedAt,
      httpStatus: 200,
    });

    return jsonOk();
  }

  const alreadyProcessed =
    localPayment.processedAt &&
    localPayment.status === nextPaymentStatus &&
    localPayment.providerStatus === nextProviderStatus;

  if (alreadyProcessed) {
    console.info("yookassa_webhook_duplicate", {
      providerPaymentId,
      appointmentId: localPayment.appointmentId,
      eventType,
      duration: Date.now() - startedAt,
      httpStatus: 200,
    });

    return jsonOk();
  }

  const [updatedAppointment] = await db.transaction(async (tx) => {
    const [appointment] = await tx
      .select()
      .from(appointmentRequests)
      .where(eq(appointmentRequests.id, localPayment.appointmentId))
      .limit(1);

    if (!appointment) {
      await tx
        .update(yookassaPayments)
        .set({
          providerStatus: nextProviderStatus,
          status: nextPaymentStatus,
          errorCode: "appointment_not_found",
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(yookassaPayments.id, localPayment.id));

      return [];
    }

    await tx
      .update(yookassaPayments)
      .set({
        providerStatus: nextProviderStatus,
        status: nextPaymentStatus,
        paidAmountKopeks: nextPaymentStatus === "paid" ? localPayment.amountKopeks : localPayment.paidAmountKopeks,
        confirmationUrl: providerPayment.confirmation?.confirmation_url ?? null,
        capturedAt: nextPaymentStatus === "paid" ? new Date() : localPayment.capturedAt,
        canceledAt: nextPaymentStatus === "cancelled" ? new Date() : localPayment.canceledAt,
        errorCode: null,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(yookassaPayments.id, localPayment.id));

    const now = new Date();
    const isLatePaidHold =
      nextPaymentStatus === "paid" &&
      appointment.status === "awaiting_payment" &&
      appointment.holdExpiresAt &&
      appointment.holdExpiresAt < now;
    const shouldUpdateAppointmentPayment = appointment.status !== "cancelled";

    const [nextAppointment] = shouldUpdateAppointmentPayment
      ? await tx
          .update(appointmentRequests)
          .set({
            yookassaPaymentId: providerPaymentId,
            paymentStatus: nextPaymentStatus,
            paymentAmount: localPayment.amountKopeks / 100,
            paymentLink: providerPayment.confirmation?.confirmation_url ?? null,
            notificationStatus: "sent",
            status:
              nextPaymentStatus === "paid"
                ? isLatePaidHold
                  ? "payment_conflict"
                  : "confirmed"
                : nextPaymentStatus === "cancelled"
                  ? "expired"
                  : appointment.status,
            confirmedAt:
              nextPaymentStatus === "paid" && !isLatePaidHold
                ? now
                : appointment.confirmedAt,
            updatedAt: now,
          })
          .where(eq(appointmentRequests.id, localPayment.appointmentId))
          .returning()
      : [appointment];

    await tx.insert(appointmentHistory).values({
      appointmentId: localPayment.appointmentId,
      action: "ЮKassa",
      details: `${eventType}: ${nextPaymentStatus}.`,
    });

    await tx.insert(paymentEvents).values({
      appointmentId: localPayment.appointmentId,
      paymentId: localPayment.id,
      eventType:
        nextPaymentStatus === "paid"
          ? "payment.succeeded"
          : nextPaymentStatus === "cancelled"
            ? "payment.canceled"
            : "payment.reconciled",
      oldStatus: localPayment.status,
      newStatus: nextPaymentStatus,
      amountKopeks: localPayment.amountKopeks,
      source: "webhook",
    });

    if (
      nextPaymentStatus === "paid" &&
      appointment.userId &&
      localPayment.sessionsCountSnapshot &&
      localPayment.sessionsCountSnapshot > 1
    ) {
      const [existingPackage] = await tx
        .select({ id: userConsultationPackages.id })
        .from(userConsultationPackages)
        .where(eq(userConsultationPackages.paymentId, localPayment.id))
        .limit(1);

      if (!existingPackage) {
        await tx.insert(userConsultationPackages).values({
          userId: appointment.userId,
          title: localPayment.productNameSnapshot ?? "Консультации",
          productId: localPayment.productId,
          paymentId: localPayment.id,
          productCodeSnapshot: localPayment.productCodeSnapshot,
          productNameSnapshot: localPayment.productNameSnapshot,
          sessionsCountSnapshot: localPayment.sessionsCountSnapshot,
          priceKopeksSnapshot: localPayment.priceKopeksSnapshot,
          currencySnapshot: localPayment.currencySnapshot,
          durationMinutesSnapshot: localPayment.durationMinutesSnapshot,
          receiptDescriptionSnapshot:
            localPayment.receiptDescriptionSnapshot,
          consultationFormat: "mixed",
          totalSessions: localPayment.sessionsCountSnapshot,
          usedSessions: 0,
          remainingSessions: localPayment.sessionsCountSnapshot,
          status: "active",
          paidAt: now,
          activatedAt: now,
        });
      }
    }

    return [nextAppointment];
  });

  if (updatedAppointment && nextPaymentStatus === "paid" && !localPayment.notifiedAt) {
    const [notificationResult, invitationResult] = await Promise.all([
      notifyOwnerPayment(updatedAppointment),
      sendPaidAppointmentInvitation({
        appointment: updatedAppointment,
        paymentId: localPayment.id,
      }),
    ]);

    await db.transaction(async (tx) => {
      await tx
        .update(yookassaPayments)
        .set({
          notifiedAt: notificationResult.ok ? new Date() : null,
          errorCode: notificationResult.ok
            ? null
            : notificationResult.reason?.slice(0, 240) ?? "notification_failed",
          updatedAt: new Date(),
        })
        .where(eq(yookassaPayments.id, localPayment.id));

      await tx.insert(appointmentHistory).values({
        appointmentId: localPayment.appointmentId,
        action: "Telegram",
        details: notificationResult.ok
          ? "Владельцу отправлено уведомление об оплате."
          : notificationResult.reason,
      });

      await tx.insert(appointmentHistory).values({
        appointmentId: localPayment.appointmentId,
        action: "Email",
        details: invitationResult.ok
          ? "Клиенту отправлена одноразовая ссылка для входа в личный кабинет."
          : invitationResult.reason,
      });
    });
  }

  console.info("yookassa_webhook_processed", {
    providerPaymentId,
    appointmentId: localPayment.appointmentId,
    eventType,
    oldStatus: localPayment.status,
    newStatus: nextPaymentStatus,
    duration: Date.now() - startedAt,
    httpStatus: 200,
  });

  return jsonOk();
}
