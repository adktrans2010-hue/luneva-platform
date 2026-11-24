import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { appointmentRequests, yookassaPayments } from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";

export async function GET(request: Request) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const payments = await db
    .select({
      id: yookassaPayments.id,
      createdAt: yookassaPayments.createdAt,
      status: yookassaPayments.status,
      providerStatus: yookassaPayments.providerStatus,
      providerPaymentId: yookassaPayments.providerPaymentId,
      amountKopeks: yookassaPayments.amountKopeks,
      paidAmountKopeks: yookassaPayments.paidAmountKopeks,
      refundedAmountKopeks: yookassaPayments.refundedAmountKopeks,
      currency: yookassaPayments.currency,
      appointmentId: yookassaPayments.appointmentId,
      productName: yookassaPayments.productNameSnapshot,
      clientName: appointmentRequests.name,
      scheduledAt: appointmentRequests.scheduledAt,
      appointmentStatus: appointmentRequests.status,
    })
    .from(yookassaPayments)
    .leftJoin(appointmentRequests, eq(yookassaPayments.appointmentId, appointmentRequests.id))
    .orderBy(desc(yookassaPayments.createdAt))
    .limit(100);

  return NextResponse.json(payments);
}
