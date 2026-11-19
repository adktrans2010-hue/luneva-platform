import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  accountInvitations,
  appointmentRequests,
  users,
} from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";
import {
  createPaidAppointmentConfirmation,
  consultationEmailAccess,
  renderPaidAppointmentEmailHtml,
  renderPaidAppointmentTelegram,
} from "@/src/lib/paid-appointment-confirmation";

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
  serviceName,
}: {
  appointment: typeof appointmentRequests.$inferSelect;
  paymentId: string;
  serviceName: string;
}) {
  const email = normalizeEmail(
    appointment.normalizedEmail || appointment.contact || ""
  );

  if (!email || !email.includes("@") || !isEmailConfigured()) {
    return {
      ok: false as const,
      skipped: !email || !email.includes("@"),
      reason: !email || !email.includes("@")
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

  const invitation = existingUser ? null : await createAccountInvitation({
    email,
    appointmentId: appointment.id,
    paymentId,
    userId: appointment.userId,
  });

  const confirmation = createPaidAppointmentConfirmation(appointment, serviceName);
  const accountUrl = invitation?.url ?? `${getSiteUrl()}/account`;
  const access = consultationEmailAccess(appointment);
  const text = [
    "Здравствуйте!",
    "",
    renderPaidAppointmentTelegram(confirmation),
    "",
    ...(access ? [access.title, access.message, access.url || "", ""] : []),
    invitation ? "Чтобы открыть личный кабинет и установить пароль, перейдите по одноразовой ссылке:" : "Открыть личный кабинет:",
    accountUrl,
    "",
    invitation ? "Ссылка действует 7 дней и может быть использована один раз." : "Войдите с вашим существующим паролем.",
  ].join("\n");

  await sendMail({
    to: email,
    subject: "Ваша консультация оплачена и подтверждена",
    text,
    html: renderPaidAppointmentEmailHtml(confirmation, accountUrl, appointment),
  });

  return { ok: true as const, invitationId: invitation?.invitation.id ?? null, existingUser: !!existingUser };
}
