import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentHistory,
  appointmentRequests,
  yookassaPayments,
  yookassaRefunds,
} from "@/src/db/schema";

export async function GET() {
  const data = await db
    .select()
    .from(appointmentRequests)
    .orderBy(desc(appointmentRequests.createdAt));

  const history = await db
    .select()
    .from(appointmentHistory)
    .orderBy(desc(appointmentHistory.createdAt));

  const payments = await db
    .select()
    .from(yookassaPayments)
    .orderBy(desc(yookassaPayments.createdAt));

  const refunds = await db
    .select()
    .from(yookassaRefunds)
    .orderBy(desc(yookassaRefunds.createdAt));

  return NextResponse.json(
    data.map((appointment) => {
      const appointmentPayments = payments.filter(
        (payment) => payment.appointmentId === appointment.id
      );
      const payment = appointmentPayments[0] ?? null;
      const paymentRefunds = payment
        ? refunds.filter((refund) => refund.paymentId === payment.id)
        : [];
      const paidAmountKopeks =
        payment?.paidAmountKopeks ?? payment?.amountKopeks ?? 0;
      const refundedAmountKopeks = paymentRefunds
        .filter((refund) => refund.status === "succeeded")
        .reduce((sum, refund) => sum + refund.amountKopeks, 0);
      const activeRefundAmountKopeks = paymentRefunds
        .filter((refund) => ["created", "pending"].includes(refund.status))
        .reduce((sum, refund) => sum + refund.amountKopeks, 0);
      const refundableAmountKopeks = Math.max(
        0,
        paidAmountKopeks - refundedAmountKopeks - activeRefundAmountKopeks
      );

      return {
        ...appointment,
        paymentSummary: payment
          ? {
              id: payment.id,
              providerPaymentId: payment.providerPaymentId,
              status: payment.status,
              providerStatus: payment.providerStatus,
              amountKopeks: payment.amountKopeks,
              paidAmountKopeks,
              refundedAmountKopeks,
              activeRefundAmountKopeks,
              refundableAmountKopeks,
              capturedAt: payment.capturedAt,
              canceledAt: payment.canceledAt,
              fullyRefundedAt: payment.fullyRefundedAt,
              latestRefund: paymentRefunds[0] ?? null,
            }
          : null,
        history: history.filter(
          (entry) => entry.appointmentId === appointment.id
        ),
      };
    })
  );
}
