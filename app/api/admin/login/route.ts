import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminAuthConfigured,
} from "@/src/lib/admin-auth";
import { getAdminSettings, updateAdminSettings } from "@/src/lib/admin-settings";
import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "@/src/lib/password";
import { publicUrl } from "@/src/lib/public-url";
import { verifyTotpCode } from "@/src/lib/totp";
import {
  clearLoginFailures,
  getLoginBlock,
  getLoginClientIp,
  recordLoginFailure,
} from "@/src/lib/admin-login-rate-limit";
import { setNewAdminCsrfCookie } from "@/src/lib/admin-security";

function loginError(request: NextRequest, error: string) {
  return NextResponse.redirect(
    publicUrl(request, `/admin/login?error=${error}`),
    { status: 303 }
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const totpCode = String(formData.get("totpCode") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");
  const redirectTo = nextPath.startsWith("/admin") ? nextPath : "/admin";
  const normalizedEmail = email.trim().toLowerCase();
  const clientIp = getLoginClientIp(request.headers);
  const block = await getLoginBlock(clientIp, normalizedEmail);

  if (block) {
    const response = loginError(request, "locked");
    response.headers.set("Retry-After", String(block.retryAfterSeconds));
    return response;
  }

  const settings = await getAdminSettings();

  if (!isAdminAuthConfigured() || !settings?.email) {
    return NextResponse.redirect(
      publicUrl(request, "/admin/login?error=setup"),
      { status: 303 }
    );
  }

  if (
    normalizedEmail !== settings.email.trim().toLowerCase() ||
    !settings.passwordHash ||
    !verifyPassword(password, settings.passwordHash)
  ) {
    const blockedUntil = await recordLoginFailure(clientIp, normalizedEmail);
    return loginError(request, blockedUntil ? "locked" : "credentials");
  }

  if (
    settings.totpEnabled &&
    (!settings.totpSecret || !verifyTotpCode(settings.totpSecret, totpCode))
  ) {
    const blockedUntil = await recordLoginFailure(clientIp, normalizedEmail);
    return loginError(request, blockedUntil ? "locked" : "totp");
  }

  await clearLoginFailures(clientIp, normalizedEmail);

  let sessionPasswordHash = settings.passwordHash;
  if (needsPasswordRehash(settings.passwordHash)) {
    sessionPasswordHash = hashPassword(password);
    await updateAdminSettings({ passwordHash: sessionPasswordHash });
  }

  const response = NextResponse.redirect(publicUrl(request, redirectTo), {
    status: 303,
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await createAdminSessionToken({
      email: settings.email,
      passwordHash: sessionPasswordHash,
      role: "admin",
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  setNewAdminCsrfCookie(response);

  return response;
}
