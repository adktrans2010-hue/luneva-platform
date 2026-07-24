import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";
import { notifyOwnerPayment } from "@/src/lib/telegram";
import { createOrReuseAppointmentPayment } from "@/src/lib/appointment-payments";

type AppointmentPaymentParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: AppointmentPaymentParams) {
  const admin = await requireAdminApiSession(request);
  if (!admin.authorized) return admin.response;

  const { id } = await params;

  const [appointment] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, id))
    .limit(1);

  if (!appointment) {
    return NextResponse.json({ error: "Запись не найдена." }, { status: 404 });
  }

  try {
    const payment = await createOrReuseAppointmentPayment({
      appointment,
      source: "admin",
    });

    const [updatedAppointment] = await db
      .select()
      .from(appointmentRequests)
      .where(eq(appointmentRequests.id, id))
      .limit(1);

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Оплата",
      details: payment.paymentUrl
        ? `Создан платеж ЮKassa: ${payment.paymentUrl}`
        : "Создан платеж ЮKassa без ссылки для перехода.",
    });

    const telegramResult = await notifyOwnerPayment(updatedAppointment);

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Telegram",
      details: telegramResult.ok
        ? "Владельцу отправлено уведомление о новой оплате."
        : telegramResult.reason,
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось создать платеж ЮKassa.",
      },
      { status: 400 }
    );
  }
}
