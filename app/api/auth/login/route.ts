import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "@/src/lib/password";
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

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/account");
  const redirectTo = nextPath.startsWith("/") ? nextPath : "/account";

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(publicUrl(request, "/login?error=login"), {
      status: 303,
    });
  }

  if (needsPasswordRehash(user.passwordHash)) {
    await db
      .update(users)
      .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  const response = NextResponse.redirect(publicUrl(request, redirectTo), {
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
