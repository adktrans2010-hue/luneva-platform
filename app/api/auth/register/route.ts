import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { userRegistrationCodes, users } from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { hashPassword } from "@/src/lib/password";
import { publicUrl } from "@/src/lib/public-url";

export const runtime = "nodejs";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return NextResponse.redirect(
      publicUrl(request, "/register?error=fields"),
      { status: 303 }
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.redirect(
      publicUrl(request, "/register?error=email"),
      { status: 303 }
    );
  }

  const code = createVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db
    .delete(userRegistrationCodes)
    .where(eq(userRegistrationCodes.email, email));

  await db.insert(userRegistrationCodes).values({
    name,
    email,
    phone,
    passwordHash: hashPassword(password),
    codeHash: hashPassword(code),
    expiresAt,
  });

  const canSendEmail = isEmailConfigured();
  const canShowLocalCode = !canSendEmail && process.env.NODE_ENV !== "production";

  if (canSendEmail) {
    try {
      await sendMail({
        to: email,
        subject: "Код подтверждения Luneva Psy",
        text: [
          `Здравствуйте, ${name}!`,
          "",
          `Ваш код подтверждения регистрации: ${code}`,
          "Код действует 15 минут.",
          "",
          "Если вы не регистрировались на сайте Luneva Psy, просто проигнорируйте это письмо.",
        ].join("\n"),
      });
    } catch (error) {
      console.error("Registration email failed", error);
      await db
        .delete(userRegistrationCodes)
        .where(eq(userRegistrationCodes.email, email));

      return NextResponse.redirect(
        publicUrl(request, "/register?error=email_send"),
        { status: 303 }
      );
    }
  }

  if (!canSendEmail && !canShowLocalCode) {
    await db
      .delete(userRegistrationCodes)
      .where(eq(userRegistrationCodes.email, email));

    return NextResponse.redirect(
      publicUrl(request, "/register?error=email_send"),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    publicUrl(
      request,
      `/verify?email=${encodeURIComponent(email)}${
        canShowLocalCode ? `&localCode=${code}` : ""
      }`
    ),
    { status: 303 }
  );
}
