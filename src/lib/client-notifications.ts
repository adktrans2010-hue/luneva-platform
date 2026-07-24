import { db } from "@/src/db";
import { clientNotifications } from "@/src/db/schema";

export async function createClientNotification(options: {
  userId: string | null;
  appointmentId?: string | null;
  kind?: string;
  title: string;
  message: string;
}) {
  if (!options.userId) {
    return null;
  }

  const [notification] = await db
    .insert(clientNotifications)
    .values({
      userId: options.userId,
      appointmentId: options.appointmentId ?? null,
      kind: options.kind ?? "message",
      title: options.title,
      message: options.message,
    })
    .returning();

  return notification;
}
