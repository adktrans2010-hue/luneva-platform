import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { passwordResetCodes, users } from "@/src/db/schema";
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
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!email) {
    return NextResponse.redirect(
      publicUrl(request, "/forgot-password?error=email"),
      { status: 303 }
    );
  }

  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return NextResponse.redirect(
      publicUrl(request, "/forgot-password?sent=1"),
      { status: 303 }
    );
  }

  const code = createVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, email));

  await db.insert(passwordResetCodes).values({
    email,
    codeHash: hashPassword(code),
    expiresAt,
  });

  const canSendEmail = isEmailConfigured();
  const canShowLocalCode = !canSendEmail && process.env.NODE_ENV !== "production";

  if (canSendEmail) {
    try {
      await sendMail({
        to: email,
        subject: "Восстановление пароля Luneva Psy",
        text: [
          `Здравствуйте, ${user.name}!`,
          "",
          `Ваш код для восстановления пароля: ${code}`,
          "Код действует 15 минут.",
          "",
          "Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.",
        ].join("\n"),
      });
    } catch (error) {
      console.error("Password reset email failed", error);
      await db
        .delete(passwordResetCodes)
        .where(eq(passwordResetCodes.email, email));

      return NextResponse.redirect(
        publicUrl(request, "/forgot-password?error=email_send"),
        { status: 303 }
      );
    }
  }

  if (!canSendEmail && !canShowLocalCode) {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, email));

    return NextResponse.redirect(
      publicUrl(request, "/forgot-password?error=email_send"),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    publicUrl(
      request,
      `/reset-password?email=${encodeURIComponent(email)}${
        canShowLocalCode ? `&localCode=${code}` : ""
      }`
    ),
    { status: 303 }
  );
}
