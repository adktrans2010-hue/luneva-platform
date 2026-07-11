import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { passwordResetCodes, users } from "@/src/db/schema";
import { hashPassword, verifyPassword } from "@/src/lib/password";
import {
  createUserSessionToken,
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
} from "@/src/lib/user-session";

export const runtime = "nodejs";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function redirectToReset(request: NextRequest, email: string, error: string) {
  return NextResponse.redirect(
    new URL(
      `/reset-password?email=${encodeURIComponent(email)}&error=${error}`,
      request.url
    ),
    { status: 303 }
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !/^\d{6}$/.test(code) || password.length < 8) {
    return redirectToReset(request, email, "fields");
  }

  const [pending] = await db
    .select()
    .from(passwordResetCodes)
    .where(eq(passwordResetCodes.email, email))
    .limit(1);

  if (!pending) {
    return redirectToReset(request, email, "missing");
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, email));

    return redirectToReset(request, email, "expired");
  }

  if (pending.attempts >= 5) {
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, email));

    return redirectToReset(request, email, "attempts");
  }

  if (!verifyPassword(code, pending.codeHash)) {
    await db
      .update(passwordResetCodes)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(passwordResetCodes.email, email));

    return redirectToReset(request, email, "code");
  }

  const [user] = await db
    .update(users)
    .set({
      passwordHash: hashPassword(password),
      updatedAt: new Date(),
    })
    .where(eq(users.email, email))
    .returning();

  await db.delete(passwordResetCodes).where(eq(passwordResetCodes.email, email));

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=login", request.url), {
      status: 303,
    });
  }

  const response = NextResponse.redirect(new URL("/account", request.url), {
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
