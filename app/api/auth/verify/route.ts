import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { userRegistrationCodes, users } from "@/src/db/schema";
import { verifyPassword } from "@/src/lib/password";
import { publicUrl } from "@/src/lib/public-url";
import {
  createUserSessionToken,
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
} from "@/src/lib/user-session";

export const runtime = "nodejs";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function redirectToVerify(request: NextRequest, email: string, error: string) {
  return NextResponse.redirect(
    publicUrl(request, `/verify?email=${encodeURIComponent(email)}&error=${error}`),
    { status: 303 }
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !/^\d{6}$/.test(code)) {
    return redirectToVerify(request, email, "code");
  }

  const [pending] = await db
    .select()
    .from(userRegistrationCodes)
    .where(eq(userRegistrationCodes.email, email))
    .limit(1);

  if (!pending) {
    return redirectToVerify(request, email, "missing");
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    await db
      .delete(userRegistrationCodes)
      .where(eq(userRegistrationCodes.email, email));

    return redirectToVerify(request, email, "expired");
  }

  if (pending.attempts >= 5) {
    await db
      .delete(userRegistrationCodes)
      .where(eq(userRegistrationCodes.email, email));

    return redirectToVerify(request, email, "attempts");
  }

  if (!verifyPassword(code, pending.codeHash)) {
    await db
      .update(userRegistrationCodes)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(userRegistrationCodes.email, email));

    return redirectToVerify(request, email, "code");
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(userRegistrationCodes)
      .where(eq(userRegistrationCodes.email, email));

    return redirectToVerify(request, email, "email");
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
    })
    .returning();

  await db
    .delete(userRegistrationCodes)
    .where(eq(userRegistrationCodes.email, email));

  const response = NextResponse.redirect(publicUrl(request, "/account"), {
    status: 303,
  });

  response.cookies.set({
    name: USER_COOKIE_NAME,
    value: await createUserSessionToken(createdUser.id),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: USER_SESSION_MAX_AGE,
  });

  return response;
}
