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
import {
  clearRateLimit,
  consumeRateLimit,
  getRequestClientIp,
} from "@/src/lib/rate-limit";
import { recordLoginAudit } from "@/src/lib/login-audit";

export const runtime = "nodejs";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function safeAccountRedirect(value: string) {
  return value === "/account" || value.startsWith("/account/")
    ? value
    : "/account";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/account");
  const redirectTo = safeAccountRedirect(nextPath);
  const ip = getRequestClientIp(request.headers);
  const rateIdentifier = `${ip}|${email}`;
  const rate = await consumeRateLimit({
    scope: "user-login",
    identifier: rateIdentifier,
    limit: 5,
    windowMs: 15 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  });

  if (!rate.allowed) {
    await recordLoginAudit({ actorType: "user", email, success: false, reason: "rate_limited", headers: request.headers });
    return NextResponse.redirect(publicUrl(request, "/login?error=rate"), {
      status: 303,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await recordLoginAudit({ actorType: "user", email, success: false, reason: "invalid_credentials", headers: request.headers });
    return NextResponse.redirect(publicUrl(request, "/login?error=login"), {
      status: 303,
    });
  }

  if (user.isBlocked || user.deletedAt) {
    await recordLoginAudit({ actorType: "user", email, success: false, reason: "blocked", headers: request.headers });
    return NextResponse.redirect(publicUrl(request, "/login?error=blocked"), {
      status: 303,
    });
  }

  await clearRateLimit("user-login", rateIdentifier);
  await recordLoginAudit({ actorType: "user", email, success: true, reason: "password", headers: request.headers });

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
