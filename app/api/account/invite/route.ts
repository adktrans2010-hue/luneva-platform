import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  accountInvitations,
  appointmentRequests,
  userConsultationPackages,
  users,
  yookassaPayments,
} from "@/src/db/schema";
import { hashInvitationToken } from "@/src/lib/account-invitations";
import { hashPassword } from "@/src/lib/password";
import {
  createUserSessionToken,
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
} from "@/src/lib/user-session";
import { publicUrl } from "@/src/lib/public-url";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token || password.length < 8) {
    return NextResponse.redirect(
      publicUrl(request, `/account/invite?token=${encodeURIComponent(token)}&error=password`),
      { status: 303 }
    );
  }

  const tokenHash = hashInvitationToken(token);
  const [invitation] = await db
    .select()
    .from(accountInvitations)
    .where(
      and(
        eq(accountInvitations.tokenHash, tokenHash),
        isNull(accountInvitations.usedAt),
        gt(accountInvitations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invitation) {
    return NextResponse.redirect(publicUrl(request, "/account/invite"), {
      status: 303,
    });
  }

  const now = new Date();
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, invitation.email))
    .limit(1);

  const user = await db.transaction(async (tx) => {
    const [savedUser] = existingUser
      ? await tx
          .update(users)
          .set({ passwordHash: hashPassword(password), updatedAt: now })
          .where(eq(users.id, existingUser.id))
          .returning()
      : await tx
          .insert(users)
          .values({
            name: "Клиент",
            email: invitation.email,
            passwordHash: hashPassword(password),
            preferredContact: "email",
          })
          .returning();

    await tx
      .update(appointmentRequests)
      .set({
        userId: savedUser.id,
        updatedAt: now,
      })
      .where(eq(appointmentRequests.normalizedEmail, invitation.email));

    if (invitation.appointmentId) {
      const [paidPayment] = await tx
        .select()
        .from(yookassaPayments)
        .where(eq(yookassaPayments.appointmentId, invitation.appointmentId))
        .limit(1);

      if (
        paidPayment?.status === "paid" &&
        paidPayment.sessionsCountSnapshot &&
        paidPayment.sessionsCountSnapshot > 1
      ) {
        const [existingPackage] = await tx
          .select({ id: userConsultationPackages.id })
          .from(userConsultationPackages)
          .where(eq(userConsultationPackages.paymentId, paidPayment.id))
          .limit(1);

        if (!existingPackage) {
          await tx.insert(userConsultationPackages).values({
            userId: savedUser.id,
            title: paidPayment.productNameSnapshot ?? "Консультации",
            productId: paidPayment.productId,
            paymentId: paidPayment.id,
            productCodeSnapshot: paidPayment.productCodeSnapshot,
            productNameSnapshot: paidPayment.productNameSnapshot,
            sessionsCountSnapshot: paidPayment.sessionsCountSnapshot,
            priceKopeksSnapshot: paidPayment.priceKopeksSnapshot,
            currencySnapshot: paidPayment.currencySnapshot,
            durationMinutesSnapshot: paidPayment.durationMinutesSnapshot,
            receiptDescriptionSnapshot: paidPayment.receiptDescriptionSnapshot,
            consultationFormat: "mixed",
            totalSessions: paidPayment.sessionsCountSnapshot,
            usedSessions: 0,
            remainingSessions: paidPayment.sessionsCountSnapshot,
            status: "active",
            paidAt: paidPayment.capturedAt ?? now,
            activatedAt: now,
          });
        }
      }
    }

    await tx
      .update(accountInvitations)
      .set({ userId: savedUser.id, usedAt: now })
      .where(eq(accountInvitations.id, invitation.id));

    return savedUser;
  });

  const response = NextResponse.redirect(publicUrl(request, "/account"), {
    status: 303,
  });

  response.cookies.set({
    name: USER_COOKIE_NAME,
    value: await createUserSessionToken(user.id),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE,
  });

  return response;
}
