import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";

import { db } from "@/src/db";
import {
  accountInvitations,
  appointmentRequests,
  clientNotifications,
  passwordResetCodes,
  userRegistrationCodes,
  users,
} from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminApiSession(request);

  if (!admin.authorized) return admin.response;

  const { id } = await context.params;
  const body = (await request.json()) as { isBlocked?: unknown };
  const isBlocked = Boolean(body.isBlocked);
  const now = new Date();

  const [updatedClient] = await db
    .update(users)
    .set({
      isBlocked,
      blockedAt: isBlocked ? now : null,
      updatedAt: now,
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      isBlocked: users.isBlocked,
      blockedAt: users.blockedAt,
      updatedAt: users.updatedAt,
    });

  if (!updatedClient) {
    return NextResponse.json({ error: "Клиент не найден." }, { status: 404 });
  }

  return NextResponse.json(updatedClient);
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdminApiSession(request);

  if (!admin.authorized) return admin.response;

  const { id } = await context.params;
  const now = new Date();
  const anonymizedEmail = `deleted+${id}@deleted.local`;

  const [client] = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Клиент не найден." }, { status: 404 });
  }

  const oldEmail = client.email.trim().toLowerCase();
  const oldPhone = client.phone?.trim() || null;

  await db.delete(userRegistrationCodes).where(eq(userRegistrationCodes.email, oldEmail));
  await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, oldEmail));
  await db.delete(clientNotifications).where(eq(clientNotifications.userId, id));

  await db
    .update(accountInvitations)
    .set({
      email: anonymizedEmail,
      userId: null,
      usedAt: now,
      expiresAt: now,
    })
    .where(
      or(
        eq(accountInvitations.userId, id),
        eq(accountInvitations.email, oldEmail)
      )
    );

  const appointmentConditions = [
    eq(appointmentRequests.userId, id),
    eq(appointmentRequests.normalizedEmail, oldEmail),
    eq(appointmentRequests.contact, oldEmail),
  ];

  if (oldPhone) {
    appointmentConditions.push(eq(appointmentRequests.contact, oldPhone));
  }

  await db
    .update(appointmentRequests)
    .set({
      userId: null,
      name: "Удаленный клиент",
      contact: anonymizedEmail,
      normalizedEmail: null,
      contactMethod: "email",
      message: "Персональные данные клиента удалены администратором.",
      updatedAt: now,
    })
    .where(or(...appointmentConditions));

  const [deletedClient] = await db
    .update(users)
    .set({
      name: "Удаленный клиент",
      email: anonymizedEmail,
      phone: null,
      telegram: null,
      preferredContact: "email",
      isBlocked: true,
      blockedAt: now,
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      isBlocked: users.isBlocked,
      blockedAt: users.blockedAt,
      deletedAt: users.deletedAt,
      updatedAt: users.updatedAt,
    });

  if (!deletedClient) {
    return NextResponse.json({ error: "Клиент не найден." }, { status: 404 });
  }

  return NextResponse.json(deletedClient);
}
