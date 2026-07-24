import { randomUUID } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  paymentEvents,
  yookassaPayments,
  yookassaRefunds,
} from "@/src/db/schema";
import { createClientNotification } from "@/src/lib/client-notifications";
import {
  cancelYooKassaPayment,
  createYooKassaRefund,
  getYooKassaPayment,
  getYooKassaRefund,
  mapYooKassaPaymentStatus,
  mapYooKassaRefundStatus,
  parseYooKassaAmountKopeks,
  type YooKassaRefund,
} from "@/src/lib/yookassa";
import { notifyOwnerPaymentRefund } from "@/src/lib/telegram";

type RefundType = "full" | "partial";
type RefundSource = "admin" | "webhook" | "reconcile" | "yookassa_dashboard";
type DbExecutor = Pick<typeof db, "execute" | "select" | "insert" | "update">;

type CreateRefundOptions = {
  paymentId: string;
  type: RefundType;
  amountKopeks?: number;
  reason: string;
  requestedByAdminId?: string | null;
};

type SyncRefundOptions = {
  source: RefundSource;
  localRefundId?: string | null;
};

const successfulRefundStatuses = ["succeeded"];
const activeRefundStatuses = ["created", "pending"];

function formatRub(amountKopeks: number) {
  return `${(amountKopeks / 100).toLocaleString("ru-RU")} ₽`;
}

export function calculateRefundableAmount({
  paidAmountKopeks,
  succeededRefundsKopeks,
  activeRefundsKopeks = 0,
}: {
  paidAmountKopeks: number;
  succeededRefundsKopeks: number;
  activeRefundsKopeks?: number;
}) {
  return Math.max(
    0,
    paidAmountKopeks - succeededRefundsKopeks - activeRefundsKopeks
  );
}

export function assertRefundAmountIsValid({
  amountKopeks,
  refundableAmountKopeks,
}: {
  amountKopeks: number;
  refundableAmountKopeks: number;
}) {
  if (!Number.isInteger(amountKopeks) || amountKopeks <= 0) {
    throw new Error("Сумма возврата должна быть больше нуля.");
  }

  if (amountKopeks > refundableAmountKopeks) {
    throw new Error("Сумма возврата больше доступного остатка оплаты.");
  }
}

export function deriveRefundedPaymentStatus({
  paidAmountKopeks,
  refundedAmountKopeks,
}: {
  paidAmountKopeks: number;
  refundedAmountKopeks: number;
}) {
  if (refundedAmountKopeks <= 0) return "paid";
  if (refundedAmountKopeks >= paidAmountKopeks) return "refunded";

  return "partially_refunded";
}

async function lockPayment(tx: DbExecutor, paymentId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${paymentId}))`);
}

async function getRefundTotals(tx: DbExecutor, paymentId: string) {
  const refunds = await tx
    .select()
    .from(yookassaRefunds)
    .where(eq(yookassaRefunds.paymentId, paymentId));

  const succeededRefundsKopeks = refunds
    .filter((refund) => successfulRefundStatuses.includes(refund.status))
    .reduce((sum, refund) => sum + refund.amountKopeks, 0);
  const activeRefundsKopeks = refunds
    .filter((refund) => activeRefundStatuses.includes(refund.status))
    .reduce((sum, refund) => sum + refund.amountKopeks, 0);
  const hasFullRefund = refunds.some(
    (refund) =>
      refund.type === "full" &&
      ["created", "pending", "succeeded"].includes(refund.status)
  );

  return {
    refunds,
    succeededRefundsKopeks,
    activeRefundsKopeks,
    hasFullRefund,
  };
}

function ensureProviderPaymentMatchesLocal({
  localPayment,
  providerPayment,
}: {
  localPayment: typeof yookassaPayments.$inferSelect;
  providerPayment: Awaited<ReturnType<typeof getYooKassaPayment>>;
}) {
  const amountKopeks = parseYooKassaAmountKopeks(providerPayment.amount?.value);

  if (providerPayment.id !== localPayment.providerPaymentId) {
    throw new Error("Платеж ЮKassa не совпадает с локальной записью.");
  }

  if (providerPayment.status !== "succeeded" || providerPayment.paid !== true) {
    throw new Error("Возврат доступен только для успешно оплаченного платежа.");
  }

  if (providerPayment.metadata?.appointmentId !== localPayment.appointmentId) {
    throw new Error("Платеж ЮKassa привязан к другой записи.");
  }

  if (
    amountKopeks !== localPayment.amountKopeks ||
    providerPayment.amount?.currency !== localPayment.currency
  ) {
    throw new Error("Сумма или валюта платежа не совпадает с локальной записью.");
  }
}

async function updatePaymentRefundState({
  tx,
  localPayment,
  refundedAmountKopeks,
}: {
  tx: DbExecutor;
  localPayment: typeof yookassaPayments.$inferSelect;
  refundedAmountKopeks: number;
}) {
  const paidAmountKopeks =
    localPayment.paidAmountKopeks ?? localPayment.amountKopeks;
  const nextPaymentStatus = deriveRefundedPaymentStatus({
    paidAmountKopeks,
    refundedAmountKopeks,
  });

  await tx
    .update(yookassaPayments)
    .set({
      refundedAmountKopeks,
      status: nextPaymentStatus,
      fullyRefundedAt:
        nextPaymentStatus === "refunded"
          ? new Date()
          : localPayment.fullyRefundedAt,
      updatedAt: new Date(),
    })
    .where(eq(yookassaPayments.id, localPayment.id));

  await tx
    .update(appointmentRequests)
    .set({
      paymentStatus: nextPaymentStatus,
      updatedAt: new Date(),
    })
    .where(eq(appointmentRequests.id, localPayment.appointmentId));

  return nextPaymentStatus;
}

async function recordPaymentEvent(options: {
  appointmentId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  eventType: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  amountKopeks?: number | null;
  source: string;
  actorId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(paymentEvents).values({
    appointmentId: options.appointmentId ?? null,
    paymentId: options.paymentId ?? null,
    refundId: options.refundId ?? null,
    eventType: options.eventType,
    oldStatus: options.oldStatus ?? null,
    newStatus: options.newStatus ?? null,
    amountKopeks: options.amountKopeks ?? null,
    source: options.source,
    actorId: options.actorId ?? null,
    requestId: options.requestId ?? null,
    metadata: options.metadata ?? null,
  });
}

async function notifyRefundOnce({
  appointment,
  refund,
  payment,
  refundedAmountKopeks,
}: {
  appointment: typeof appointmentRequests.$inferSelect;
  refund: typeof yookassaRefunds.$inferSelect;
  payment: typeof yookassaPayments.$inferSelect;
  refundedAmountKopeks: number;
}) {
  if (refund.notifiedAt || refund.status !== "succeeded") return;

  const remainingAmountKopeks = Math.max(
    0,
    (payment.paidAmountKopeks ?? payment.amountKopeks) - refundedAmountKopeks
  );

  const notificationResult = await notifyOwnerPaymentRefund({
    appointment,
    refund,
    payment,
    refundedAmountKopeks,
    remainingAmountKopeks,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(yookassaRefunds)
      .set({
        notifiedAt: notificationResult.ok ? new Date() : null,
        errorCode: notificationResult.ok
          ? null
          : notificationResult.reason?.slice(0, 240) ?? "notification_failed",
        updatedAt: new Date(),
      })
      .where(eq(yookassaRefunds.id, refund.id));

    await tx.insert(appointmentHistory).values({
      appointmentId: appointment.id,
      action: "Возврат",
      details: notificationResult.ok
        ? "Владельцу отправлено уведомление о возврате."
        : notificationResult.reason,
    });
  });

  if (appointment.userId) {
    await createClientNotification({
      userId: appointment.userId,
      appointmentId: appointment.id,
      kind: "payment",
      title: "Возврат оформлен",
      message: `Возврат ${formatRub(
        refund.amountKopeks
      )} оформлен. Фактический срок зачисления зависит от банка.`,
    });
  }
}

export async function createRefund(options: CreateRefundOptions) {
  const [localPayment] = await db
    .select()
    .from(yookassaPayments)
    .where(eq(yookassaPayments.id, options.paymentId))
    .limit(1);

  if (!localPayment?.providerPaymentId) {
    throw new Error("Локальный платеж ЮKassa не найден.");
  }

  const [appointment] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, localPayment.appointmentId))
    .limit(1);

  if (!appointment) {
    throw new Error("Запись для платежа не найдена.");
  }

  const providerPayment = await getYooKassaPayment(localPayment.providerPaymentId);
  ensureProviderPaymentMatchesLocal({ localPayment, providerPayment });

  const refundAttempt = await db.transaction(async (tx) => {
    await lockPayment(tx, localPayment.id);

    const [freshPayment] = await tx
      .select()
      .from(yookassaPayments)
      .where(eq(yookassaPayments.id, localPayment.id))
      .limit(1);

    if (!freshPayment) {
      throw new Error("Платеж не найден во время подготовки возврата.");
    }

    const totals = await getRefundTotals(tx, freshPayment.id);
    const paidAmountKopeks = freshPayment.paidAmountKopeks ?? freshPayment.amountKopeks;
    const refundableAmountKopeks = calculateRefundableAmount({
      paidAmountKopeks,
      succeededRefundsKopeks: totals.succeededRefundsKopeks,
      activeRefundsKopeks: totals.activeRefundsKopeks,
    });

    if (options.type === "full" && totals.hasFullRefund) {
      throw new Error("По платежу уже есть полный возврат или активная попытка полного возврата.");
    }

    const amountKopeks =
      options.type === "full"
        ? refundableAmountKopeks
        : Number(options.amountKopeks);

    assertRefundAmountIsValid({ amountKopeks, refundableAmountKopeks });

    const [refund] = await tx
      .insert(yookassaRefunds)
      .values({
        paymentId: freshPayment.id,
        appointmentId: freshPayment.appointmentId,
        idempotenceKey: randomUUID(),
        amountKopeks,
        currency: "RUB",
        type: options.type,
        status: "created",
        reason: options.reason.trim().slice(0, 500),
        requestedBy: "admin",
        requestedByAdminId: options.requestedByAdminId ?? null,
        description: `Возврат оплаты по записи ${freshPayment.appointmentId}`,
      })
      .returning();

    await tx.insert(appointmentHistory).values({
      appointmentId: freshPayment.appointmentId,
      action: "Возврат",
      details: `Возврат создан: ${formatRub(amountKopeks)}. Причина: ${
        options.reason
      }`,
    });

    await tx.insert(paymentEvents).values({
      appointmentId: freshPayment.appointmentId,
      paymentId: freshPayment.id,
      refundId: refund.id,
      eventType: "refund.created",
      newStatus: "created",
      amountKopeks,
      source: "admin",
      actorId: options.requestedByAdminId ?? null,
      metadata: { type: options.type },
    });

    return refund;
  });

  try {
    const providerRefund = await createYooKassaRefund({
      paymentId: localPayment.providerPaymentId,
      amountKopeks: refundAttempt.amountKopeks,
      idempotenceKey: refundAttempt.idempotenceKey,
      description:
        refundAttempt.description ??
        `Возврат оплаты по записи ${localPayment.appointmentId}`,
      metadata: {
        appointmentId: localPayment.appointmentId,
        internalPaymentId: localPayment.id,
        internalRefundId: refundAttempt.id,
        refundType: refundAttempt.type,
      },
    });

    await db
      .update(yookassaRefunds)
      .set({
        providerRefundId: providerRefund.id,
        providerStatus: providerRefund.status,
        status: mapYooKassaRefundStatus(providerRefund),
        receiptStatus: providerRefund.receipt_registration ?? null,
        updatedAt: new Date(),
      })
      .where(eq(yookassaRefunds.id, refundAttempt.id));

    await db.insert(appointmentHistory).values({
      appointmentId: localPayment.appointmentId,
      action: "Возврат",
      details: `Возврат отправлен в ЮKassa: ${providerRefund.id}. Статус: ${providerRefund.status}.`,
    });

    await recordPaymentEvent({
      appointmentId: localPayment.appointmentId,
      paymentId: localPayment.id,
      refundId: refundAttempt.id,
      eventType: "refund.sent",
      oldStatus: "created",
      newStatus: providerRefund.status,
      amountKopeks: refundAttempt.amountKopeks,
      source: "admin",
      actorId: options.requestedByAdminId ?? null,
    });

    return syncRefund(providerRefund.id, {
      source: "admin",
      localRefundId: refundAttempt.id,
    });
  } catch (error) {
    await db
      .update(yookassaRefunds)
      .set({
        status: "failed",
        errorCode: error instanceof Error ? error.message.slice(0, 240) : "refund_failed",
        updatedAt: new Date(),
      })
      .where(eq(yookassaRefunds.id, refundAttempt.id));

    await recordPaymentEvent({
      appointmentId: localPayment.appointmentId,
      paymentId: localPayment.id,
      refundId: refundAttempt.id,
      eventType: "refund.failed",
      oldStatus: "created",
      newStatus: "failed",
      amountKopeks: refundAttempt.amountKopeks,
      source: "admin",
      actorId: options.requestedByAdminId ?? null,
      metadata: {
        error: error instanceof Error ? error.message.slice(0, 240) : "unknown",
      },
    });

    throw error;
  }
}

export function createFullRefund(options: Omit<CreateRefundOptions, "type" | "amountKopeks">) {
  return createRefund({ ...options, type: "full" });
}

export function createPartialRefund(options: Omit<CreateRefundOptions, "type">) {
  return createRefund({ ...options, type: "partial" });
}

export async function cancelWaitingForCapturePayment({
  paymentId,
  requestedByAdminId,
  reason,
}: {
  paymentId: string;
  requestedByAdminId?: string | null;
  reason?: string | null;
}) {
  const [localPayment] = await db
    .select()
    .from(yookassaPayments)
    .where(eq(yookassaPayments.id, paymentId))
    .limit(1);

  if (!localPayment?.providerPaymentId) {
    throw new Error("Платеж ЮKassa не найден.");
  }

  const providerPayment = await getYooKassaPayment(localPayment.providerPaymentId);

  if (providerPayment.status !== "waiting_for_capture") {
    throw new Error("Отмена авторизации доступна только для waiting_for_capture.");
  }

  const idempotenceKey = randomUUID();
  const canceledPayment = await cancelYooKassaPayment(
    localPayment.providerPaymentId,
    idempotenceKey
  );
  const nextStatus = mapYooKassaPaymentStatus(canceledPayment);

  await db.transaction(async (tx) => {
    await tx
      .update(yookassaPayments)
      .set({
        providerStatus: canceledPayment.status,
        status: nextStatus,
        canceledAt: canceledPayment.status === "canceled" ? new Date() : null,
        errorCode: null,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(yookassaPayments.id, localPayment.id));

    await tx
      .update(appointmentRequests)
      .set({
        paymentStatus: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(appointmentRequests.id, localPayment.appointmentId));

    await tx.insert(appointmentHistory).values({
      appointmentId: localPayment.appointmentId,
      action: "ЮKassa",
      details: `Авторизация платежа отменена через API. Причина: ${
        reason || "не указана"
      }`,
    });

    await tx.insert(paymentEvents).values({
      appointmentId: localPayment.appointmentId,
      paymentId: localPayment.id,
      eventType: "payment.canceled",
      oldStatus: localPayment.status,
      newStatus: nextStatus,
      source: "admin",
      actorId: requestedByAdminId ?? null,
      requestId: idempotenceKey,
    });
  });

  return canceledPayment;
}

async function ensureLocalRefundForProviderRefund(providerRefund: YooKassaRefund) {
  const providerRefundId = providerRefund.id;

  const [existingRefund] = await db
    .select()
    .from(yookassaRefunds)
    .where(eq(yookassaRefunds.providerRefundId, providerRefundId))
    .limit(1);

  if (existingRefund) return existingRefund;

  const [localPayment] = await db
    .select()
    .from(yookassaPayments)
    .where(eq(yookassaPayments.providerPaymentId, providerRefund.payment_id))
    .limit(1);

  if (!localPayment) {
    await recordPaymentEvent({
      eventType: "refund.manual_review",
      newStatus: "manual_review",
      amountKopeks: parseYooKassaAmountKopeks(providerRefund.amount?.value),
      source: "yookassa_dashboard",
      metadata: {
        providerRefundId: providerRefund.id,
        providerPaymentId: providerRefund.payment_id,
      },
    });

    return null;
  }

  const amountKopeks = parseYooKassaAmountKopeks(providerRefund.amount?.value);

  if (!amountKopeks || providerRefund.amount?.currency !== localPayment.currency) {
    await recordPaymentEvent({
      appointmentId: localPayment.appointmentId,
      paymentId: localPayment.id,
      eventType: "refund.manual_review",
      newStatus: "manual_review",
      source: "yookassa_dashboard",
      metadata: {
        providerRefundId: providerRefund.id,
        reason: "amount_or_currency_mismatch",
      },
    });

    return null;
  }

  const [refund] = await db
    .insert(yookassaRefunds)
    .values({
      paymentId: localPayment.id,
      appointmentId: localPayment.appointmentId,
      providerRefundId: providerRefund.id,
      idempotenceKey: `dashboard:${providerRefund.id}`,
      amountKopeks,
      currency: "RUB",
      type: amountKopeks >= localPayment.amountKopeks ? "full" : "partial",
      status: mapYooKassaRefundStatus(providerRefund),
      providerStatus: providerRefund.status,
      requestedBy: "yookassa_dashboard",
      description: providerRefund.description ?? "Возврат создан в кабинете ЮKassa",
      cancellationParty: providerRefund.cancellation_details?.party ?? null,
      cancellationReason: providerRefund.cancellation_details?.reason ?? null,
      receiptStatus: providerRefund.receipt_registration ?? null,
      processedAt: providerRefund.status === "succeeded" ? new Date() : null,
    })
    .returning();

  await recordPaymentEvent({
    appointmentId: localPayment.appointmentId,
    paymentId: localPayment.id,
    refundId: refund.id,
    eventType: "refund.created_externally",
    newStatus: refund.status,
    amountKopeks,
    source: "yookassa_dashboard",
  });

  return refund;
}

export async function syncRefund(providerRefundId: string, options: SyncRefundOptions) {
  const providerRefund = await getYooKassaRefund(providerRefundId);
  const localRefund =
    options.localRefundId
      ? (
          await db
            .select()
            .from(yookassaRefunds)
            .where(eq(yookassaRefunds.id, options.localRefundId))
            .limit(1)
        )[0]
      : await ensureLocalRefundForProviderRefund(providerRefund);

  if (!localRefund) {
    return null;
  }

  const [localPayment] = await db
    .select()
    .from(yookassaPayments)
    .where(eq(yookassaPayments.id, localRefund.paymentId))
    .limit(1);

  if (!localPayment) {
    throw new Error("Платеж для возврата не найден.");
  }

  const amountKopeks = parseYooKassaAmountKopeks(providerRefund.amount?.value);
  const validationError =
    providerRefund.payment_id !== localPayment.providerPaymentId
      ? "payment_mismatch"
      : amountKopeks !== localRefund.amountKopeks
        ? "amount_mismatch"
        : providerRefund.amount?.currency !== localRefund.currency
          ? "currency_mismatch"
          : providerRefund.metadata?.internalRefundId &&
              providerRefund.metadata.internalRefundId !== localRefund.id
            ? "refund_mismatch"
            : null;

  if (validationError) {
    await db
      .update(yookassaRefunds)
      .set({
        status: "manual_review",
        providerStatus: providerRefund.status,
        errorCode: validationError,
        updatedAt: new Date(),
      })
      .where(eq(yookassaRefunds.id, localRefund.id));

    await recordPaymentEvent({
      appointmentId: localRefund.appointmentId,
      paymentId: localRefund.paymentId,
      refundId: localRefund.id,
      eventType: "refund.manual_review",
      oldStatus: localRefund.status,
      newStatus: "manual_review",
      amountKopeks: localRefund.amountKopeks,
      source: options.source,
      metadata: { validationError },
    });

    return null;
  }

  const nextRefundStatus = mapYooKassaRefundStatus(providerRefund);
  const alreadyProcessed =
    localRefund.processedAt &&
    localRefund.status === nextRefundStatus &&
    localRefund.providerStatus === providerRefund.status;

  if (alreadyProcessed) {
    return localRefund;
  }

  const [updated] = await db.transaction(async (tx) => {
    await lockPayment(tx, localPayment.id);

    await tx
      .update(yookassaRefunds)
      .set({
        providerRefundId: providerRefund.id,
        providerStatus: providerRefund.status,
        status: nextRefundStatus,
        cancellationParty: providerRefund.cancellation_details?.party ?? null,
        cancellationReason: providerRefund.cancellation_details?.reason ?? null,
        receiptStatus: providerRefund.receipt_registration ?? null,
        errorCode: nextRefundStatus === "canceled" ? "refund_canceled" : null,
        processedAt:
          nextRefundStatus === "succeeded" || nextRefundStatus === "canceled"
            ? new Date()
            : localRefund.processedAt,
        updatedAt: new Date(),
      })
      .where(eq(yookassaRefunds.id, localRefund.id));

    const totals = await getRefundTotals(tx, localPayment.id);
    const succeededRefundsKopeks = totals.succeededRefundsKopeks;

    const nextPaymentStatus =
      nextRefundStatus === "succeeded"
        ? await updatePaymentRefundState({
            tx,
            localPayment,
            refundedAmountKopeks: succeededRefundsKopeks,
          })
        : localPayment.status;

    const [appointment] = await tx
      .select()
      .from(appointmentRequests)
      .where(eq(appointmentRequests.id, localRefund.appointmentId))
      .limit(1);

    await tx.insert(appointmentHistory).values({
      appointmentId: localRefund.appointmentId,
      action: "Возврат",
      details:
        nextRefundStatus === "succeeded"
          ? `Возврат подтвержден: ${formatRub(
              localRefund.amountKopeks
            )}. Всего возвращено: ${formatRub(succeededRefundsKopeks)}.`
          : nextRefundStatus === "canceled"
            ? `Возврат отклонен: ${
                providerRefund.cancellation_details?.reason ?? "причина не указана"
              }.`
            : `Статус возврата: ${nextRefundStatus}.`,
    });

    await tx.insert(paymentEvents).values({
      appointmentId: localRefund.appointmentId,
      paymentId: localPayment.id,
      refundId: localRefund.id,
      eventType:
        nextRefundStatus === "succeeded"
          ? "refund.succeeded"
          : nextRefundStatus === "canceled"
            ? "refund.canceled"
            : "refund.reconciled",
      oldStatus: localRefund.status,
      newStatus: nextRefundStatus,
      amountKopeks: localRefund.amountKopeks,
      source: options.source,
      metadata: {
        paymentStatus: nextPaymentStatus,
      },
    });

    return [{ appointment, refundedAmountKopeks: succeededRefundsKopeks }];
  });

  const [freshRefund] = await db
    .select()
    .from(yookassaRefunds)
    .where(eq(yookassaRefunds.id, localRefund.id))
    .limit(1);

  if (updated?.appointment && freshRefund?.status === "succeeded") {
    await notifyRefundOnce({
      appointment: updated.appointment,
      refund: freshRefund,
      payment: localPayment,
      refundedAmountKopeks: updated.refundedAmountKopeks,
    });
  }

  return freshRefund ?? localRefund;
}

export async function listPaymentRefunds(paymentId: string) {
  return db
    .select()
    .from(yookassaRefunds)
    .where(eq(yookassaRefunds.paymentId, paymentId));
}

export async function getPaymentRefundSummary(paymentId: string) {
  const [payment] = await db
    .select()
    .from(yookassaPayments)
    .where(eq(yookassaPayments.id, paymentId))
    .limit(1);

  if (!payment) return null;

  const totals = await getRefundTotals(db, payment.id);
  const paidAmountKopeks = payment.paidAmountKopeks ?? payment.amountKopeks;

  return {
    payment,
    refunds: totals.refunds,
    paidAmountKopeks,
    refundedAmountKopeks: totals.succeededRefundsKopeks,
    activeRefundsKopeks: totals.activeRefundsKopeks,
    refundableAmountKopeks: calculateRefundableAmount({
      paidAmountKopeks,
      succeededRefundsKopeks: totals.succeededRefundsKopeks,
      activeRefundsKopeks: totals.activeRefundsKopeks,
    }),
  };
}

export async function syncPendingRefunds({ dryRun = false }: { dryRun?: boolean }) {
  const refunds = await db
    .select()
    .from(yookassaRefunds)
    .where(inArray(yookassaRefunds.status, ["created", "pending", "failed"]));

  let checked = 0;
  let updated = 0;
  let skipped = 0;

  for (const refund of refunds) {
    if (!refund.providerRefundId) {
      skipped += 1;
      continue;
    }

    checked += 1;
    if (dryRun) continue;

    const before = refund.status;
    const synced = await syncRefund(refund.providerRefundId, { source: "reconcile" });
    if (synced && synced.status !== before) updated += 1;
  }

  return { checked, updated, skipped, dryRun };
}
