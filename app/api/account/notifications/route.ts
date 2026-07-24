import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/db";
import { clientNotifications } from "@/src/db/schema";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromSession(
    request.cookies.get(USER_COOKIE_NAME)?.value
  );

  if (!userId) {
    return NextResponse.json({ error: "Войдите в кабинет." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const notificationId = String(body.notificationId ?? "").trim();

  if (body.all === true) {
    await db
      .update(clientNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(clientNotifications.userId, userId),
          isNull(clientNotifications.readAt)
        )
      );

    return NextResponse.json({ success: true });
  }

  if (!notificationId) {
    return NextResponse.json(
      { error: "Уведомление не выбрано." },
      { status: 400 }
    );
  }

  await db
    .update(clientNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(clientNotifications.id, notificationId),
        eq(clientNotifications.userId, userId)
      )
    );

  return NextResponse.json({ success: true });
}
