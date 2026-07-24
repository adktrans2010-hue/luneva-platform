import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  accountInvitations,
  appointmentRequests,
  users,
} from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";

const invitationTtlDays = 7;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "https://luneva-psy.ru"
  );
}

export function hashInvitationToken(token: string) {
  return hashToken(token);
}

export async function createAccountInvitation({
  email,
  appointmentId,
  paymentId,
  userId,
}: {
  email: string;
  appointmentId: string;
  paymentId: string;
  userId?: string | null;
}) {
  const token = randomBytes(32).toString("base64url");
  const normalizedEmail = normalizeEmail(email);
  const expiresAt = new Date(
    Date.now() + invitationTtlDays * 24 * 60 * 60 * 1000
  );

  await db
    .update(accountInvitations)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(accountInvitations.email, normalizedEmail),
        eq(accountInvitations.appointmentId, appointmentId),
        isNull(accountInvitations.usedAt)
      )
    );

  const [invitation] = await db
    .insert(accountInvitations)
    .values({
      email: normalizedEmail,
      tokenHash: hashToken(token),
      appointmentId,
      paymentId,
      userId: userId ?? null,
      expiresAt,
    })
    .returning();

  return {
    invitation,
    token,
    url: `${getSiteUrl()}/account/invite?token=${encodeURIComponent(token)}`,
  };
}

export async function sendPaidAppointmentInvitation({
  appointment,
  paymentId,
}: {
  appointment: typeof appointmentRequests.$inferSelect;
  paymentId: string;
}) {
  const email = normalizeEmail(
    appointment.normalizedEmail || appointment.contact || ""
  );

  if (!email || !email.includes("@") || !isEmailConfigured()) {
    return {
      ok: false as const,
      reason: !email
        ? "У записи нет email клиента."
        : "Email не настроен на сервере.",
    };
  }

  const [existingUser] = appointment.userId
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, appointment.userId))
        .limit(1)
    : await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

  const invitation = await createAccountInvitation({
    email,
    appointmentId: appointment.id,
    paymentId,
    userId: existingUser?.id ?? appointment.userId,
  });

  await sendMail({
    to: email,
    subject: "Оплата прошла, запись подтверждена",
    text: [
      "Здравствуйте!",
      "",
      "Оплата прошла, ваша консультация подтверждена.",
      appointment.scheduledAt
        ? `Дата и время: ${appointment.scheduledAt.toLocaleString("ru-RU")}`
        : "Дата и время будут уточнены.",
      "",
      "Чтобы открыть личный кабинет и сразу установить пароль, перейдите по одноразовой ссылке:",
      invitation.url,
      "",
      "Ссылка действует 7 дней и может быть использована один раз.",
      "",
      "С уважением, Александра Лунева",
    ].join("\n"),
  });

  return { ok: true as const, invitationId: invitation.invitation.id };
}
