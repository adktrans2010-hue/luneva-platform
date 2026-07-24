import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/src/db";
import { appointmentHistory, appointmentRequests } from "@/src/db/schema";
import { createClientNotification } from "@/src/lib/client-notifications";

type AppointmentParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: AppointmentParams) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const message = String(body.message ?? "").trim();

  if (!message || message.length > 3000) {
    return NextResponse.json(
      { error: "Введите сообщение длиной до 3000 символов." },
      { status: 400 }
    );
  }

  const [appointment] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.id, id))
    .limit(1);

  if (!appointment) {
    return NextResponse.json({ error: "Запись не найдена." }, { status: 404 });
  }

  if (!appointment.userId) {
    return NextResponse.json(
      {
        error:
          "У этой записи нет связанного личного кабинета. Сообщение можно отправить по указанному контакту.",
      },
      { status: 400 }
    );
  }

  const notification = await createClientNotification({
    userId: appointment.userId,
    appointmentId: appointment.id,
    kind: "admin_message",
    title: "Сообщение от Александры",
    message,
  });

  await db.insert(appointmentHistory).values({
    appointmentId: appointment.id,
    action: "Сообщение клиенту",
    details: "Сообщение отправлено в личный кабинет.",
  });

  return NextResponse.json(notification, { status: 201 });
}
