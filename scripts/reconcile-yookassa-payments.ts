import "dotenv/config";
import { and, eq, inArray, lt } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  paymentEvents,
  yookassaPayments,
} from "@/src/db/schema";
import {
  getYooKassaPayment,
  isYooKassaConfigured,
  mapYooKassaPaymentStatus,
  parseYooKassaAmountKopeks,
} from "@/src/lib/yookassa";

const pendingStatuses = ["creating", "waiting", "invoice_sent", "failed"];
const olderThanMinutes = Number(process.env.YOOKASSA_RECONCILE_OLDER_THAN_MINUTES ?? 15);
const cutoff = new Date(Date.now() - Math.max(1, olderThanMinutes) * 60 * 1000);
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!isYooKassaConfigured()) {
    if (dryRun) {
      console.info("yookassa_reconcile_dry_run_skipped", {
        reason: "YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are not configured.",
      });
      return;
    }

    throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required.");
  }

  const pendingPayments = await db
    .select()
    .from(yookassaPayments)
    .where(
      and(
        eq(yookassaPayments.provider, "yookassa"),
        inArray(yookassaPayments.status, pendingStatuses),
        lt(yookassaPayments.updatedAt, cutoff)
      )
    );

  let checked = 0;
  let updated = 0;
  let skipped = 0;

  for (const localPayment of pendingPayments) {
    if (!localPayment.providerPaymentId) {
      skipped += 1;
      continue;
    }

    checked += 1;

    try {
      const providerPayment = await getYooKassaPayment(localPayment.providerPaymentId);
      const amountKopeks = parseYooKassaAmountKopeks(providerPayment.amount?.value);
      const currency = providerPayment.amount?.currency ?? "";

      if (
        amountKopeks !== localPayment.amountKopeks ||
        currency !== localPayment.currency ||
        providerPayment.metadata?.appointmentId !== localPayment.appointmentId
      ) {
        if (dryRun) {
          console.info("yookassa_reconcile_dry_run_validation_failed", {
            paymentId: localPayment.id,
            providerPaymentId: localPayment.providerPaymentId,
          });
          continue;
        }

        await db
          .update(yookassaPayments)
          .set({
            providerStatus: providerPayment.status,
            status: "validation_failed",
            errorCode: "reconcile_validation_failed",
            updatedAt: new Date(),
          })
          .where(eq(yookassaPayments.id, localPayment.id));

        updated += 1;
        continue;
      }

      const nextStatus = mapYooKassaPaymentStatus(providerPayment);

      if (dryRun) {
        console.info("yookassa_reconcile_dry_run_payment", {
          paymentId: localPayment.id,
          providerPaymentId: localPayment.providerPaymentId,
          oldStatus: localPayment.status,
          nextStatus,
        });
        continue;
      }

      await db.transaction(async (tx) => {
        await tx
          .update(yookassaPayments)
          .set({
            providerStatus: providerPayment.status,
            status: nextStatus,
            paidAmountKopeks:
              nextStatus === "paid"
                ? localPayment.amountKopeks
                : localPayment.paidAmountKopeks,
            confirmationUrl: providerPayment.confirmation?.confirmation_url ?? null,
            capturedAt:
              nextStatus === "paid" ? new Date() : localPayment.capturedAt,
            canceledAt:
              nextStatus === "cancelled" ? new Date() : localPayment.canceledAt,
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(yookassaPayments.id, localPayment.id));

        const [appointment] = await tx
          .select()
          .from(appointmentRequests)
          .where(eq(appointmentRequests.id, localPayment.appointmentId))
          .limit(1);

        if (appointment && appointment.status !== "cancelled") {
          await tx
            .update(appointmentRequests)
            .set({
              yookassaPaymentId: localPayment.providerPaymentId,
              paymentStatus: nextStatus,
              paymentAmount: localPayment.amountKopeks / 100,
              paymentLink: providerPayment.confirmation?.confirmation_url ?? null,
              updatedAt: new Date(),
            })
            .where(eq(appointmentRequests.id, localPayment.appointmentId));
        }

        await tx.insert(appointmentHistory).values({
          appointmentId: localPayment.appointmentId,
          action: "ЮKassa",
          details: `Сверка платежа: ${nextStatus}.`,
        });

        await tx.insert(paymentEvents).values({
          appointmentId: localPayment.appointmentId,
          paymentId: localPayment.id,
          eventType:
            nextStatus === "paid"
              ? "payment.succeeded"
              : nextStatus === "cancelled"
                ? "payment.canceled"
                : "payment.reconciled",
          oldStatus: localPayment.status,
          newStatus: nextStatus,
          amountKopeks: localPayment.amountKopeks,
          source: "reconcile",
        });
      });

      updated += 1;
    } catch (error) {
      if (dryRun) {
        console.warn(
          "yookassa_reconcile_dry_run_error",
          error instanceof Error ? error.message : "unknown"
        );
        continue;
      }

      await db
        .update(yookassaPayments)
        .set({
          errorCode:
            error instanceof Error
              ? error.message.slice(0, 240)
              : "reconcile_failed",
          updatedAt: new Date(),
        })
        .where(eq(yookassaPayments.id, localPayment.id));
    }
  }

  console.info("yookassa_reconcile_done", {
    checked,
    updated,
    skipped,
    dryRun,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "yookassa_reconcile_failed",
      error instanceof Error ? error.message : "unknown"
    );
    process.exit(1);
  });
