import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";
import { createYooKassaPayment } from "@/src/lib/yookassa";

type AppointmentPaymentParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: AppointmentPaymentParams) {
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
    const payment = await createYooKassaPayment({
      appointmentId: appointment.id,
      name: appointment.name,
      contact: appointment.contact,
      scheduledAt: appointment.scheduledAt,
    });

    const [updatedAppointment] = await db
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
      .where(eq(appointmentRequests.id, id))
      .returning();

    await db.insert(appointmentHistory).values({
      appointmentId: id,
      action: "Оплата",
      details: payment.paymentUrl
        ? `Создан платеж ЮKassa: ${payment.paymentUrl}`
        : "Создан платеж ЮKassa без ссылки для перехода.",
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
