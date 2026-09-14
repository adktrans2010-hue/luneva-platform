import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";

export const DEFAULT_PAYMENT_HOLD_MINUTES = 60;
export const MIN_PAYMENT_HOLD_MINUTES = 30;
export const MAX_PAYMENT_HOLD_MINUTES = 60;

export function getPaymentHoldMinutes(raw = process.env.PAYMENT_HOLD_MINUTES) {
  const value = Number(raw ?? DEFAULT_PAYMENT_HOLD_MINUTES);
  return Number.isInteger(value) && value >= MIN_PAYMENT_HOLD_MINUTES && value <= MAX_PAYMENT_HOLD_MINUTES
    ? value
    : DEFAULT_PAYMENT_HOLD_MINUTES;
}

export function paymentHoldExpiresAt(now = new Date(), rawMinutes?: string) {
  return new Date(now.getTime() + getPaymentHoldMinutes(rawMinutes) * 60_000);
}

export function isPaymentHoldExpired(
  appointment: Pick<typeof appointmentRequests.$inferSelect, "status" | "paymentStatus" | "holdExpiresAt">,
  now = new Date()
) {
  return (
    appointment.status === "awaiting_payment" &&
    appointment.paymentStatus !== "paid" &&
    appointment.holdExpiresAt instanceof Date &&
    appointment.holdExpiresAt <= now
  );
}

export async function expireStalePaymentHolds(now = new Date()) {
  const result = await db.execute<{ expired_count: number }>(
    // The database function owns the transition and row locking. All callers
    // (site, Telegram lazy read and the timer) therefore use the same rule.
    sql`select expire_stale_payment_holds(${now}) as expired_count`
  );
  return Number(result.rows[0]?.expired_count ?? 0);
}

export async function beginAppointmentPaymentHold(appointmentId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const [appointment] = await tx
      .select()
      .from(appointmentRequests)
      .where(eq(appointmentRequests.id, appointmentId))
      .limit(1)
      .for("update");

    if (!appointment) return null;
    if (appointment.status === "cancelled" || appointment.status === "expired") return null;
    if (appointment.paymentStatus === "paid") return appointment;

    const expiresAt = appointment.holdExpiresAt ?? paymentHoldExpiresAt(now);
    if (expiresAt <= now) return null;

    const [updated] = await tx
      .update(appointmentRequests)
      .set({
        status: "awaiting_payment",
        paymentMethod: "online",
        paymentStatus: appointment.paymentStatus === "not_required" ? "waiting" : appointment.paymentStatus,
        holdExpiresAt: expiresAt,
        updatedAt: now,
      })
      .where(and(eq(appointmentRequests.id, appointmentId), ne(appointmentRequests.status, "cancelled")))
      .returning();

    if (appointment.status !== "awaiting_payment" || !appointment.holdExpiresAt) {
      await tx.insert(appointmentHistory).values({
        appointmentId,
        action: "Резерв оплаты",
        details: `Время зарезервировано до ${expiresAt.toISOString()}.`,
      });
    }
    return updated ?? null;
  });
}

export async function failAppointmentPaymentHold(appointmentId: string, details: string) {
  await db.transaction(async (tx) => {
    const [appointment] = await tx
      .select({ status: appointmentRequests.status, paymentStatus: appointmentRequests.paymentStatus })
      .from(appointmentRequests)
      .where(eq(appointmentRequests.id, appointmentId))
      .limit(1)
      .for("update");
    if (!appointment || appointment.paymentStatus === "paid") return;
    await tx
      .update(appointmentRequests)
      .set({ status: "expired", paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(appointmentRequests.id, appointmentId));
    await tx.insert(appointmentHistory).values({
      appointmentId,
      action: "Резерв оплаты истёк",
      details,
    });
  });
}
