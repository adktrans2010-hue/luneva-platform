import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";
import { notifyOwnerPayment } from "@/src/lib/telegram";
import {
  getYooKassaPayment,
  isYooKassaConfigured,
  mapYooKassaPaymentStatus,
} from "@/src/lib/yookassa";

type YooKassaNotification = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    paid?: boolean;
    confirmation?: {
      confirmation_url?: string;
    };
    metadata?: {
      appointmentId?: string;
    };
  };
};

export async function POST(request: Request) {
  const notification = (await request.json()) as YooKassaNotification;
  const paymentId = notification.object?.id;
  const appointmentId = notification.object?.metadata?.appointmentId;

  if (!paymentId || !appointmentId) {
    return NextResponse.json({ success: true });
  }

  const [appointment] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, appointmentId))
    .limit(1);

  if (!appointment) {
    return NextResponse.json({ success: true });
  }

  const payment =
    isYooKassaConfigured()
      ? await getYooKassaPayment(paymentId)
      : notification.object;

  const paymentStatus = mapYooKassaPaymentStatus({
    status: payment?.status ?? "pending",
    paid: payment?.paid,
  });

  const [updatedAppointment] = await db
    .update(appointmentRequests)
    .set({
      yookassaPaymentId: paymentId,
      paymentStatus,
      paymentLink: payment?.confirmation?.confirmation_url ?? null,
      notificationStatus: "sent",
      updatedAt: new Date(),
    })
    .where(eq(appointmentRequests.id, appointmentId))
    .returning();

  await db.insert(appointmentHistory).values({
    appointmentId,
    action: "ЮKassa",
    details: `${notification.event ?? "payment.updated"}: ${paymentStatus}`,
  });

  const telegramResult = await notifyOwnerPayment(updatedAppointment);

  await db.insert(appointmentHistory).values({
    appointmentId,
    action: "Telegram",
    details: telegramResult.ok
      ? "Владельцу отправлено уведомление об оплате."
      : telegramResult.reason,
  });

  return NextResponse.json({ success: true });
}
