import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_BOOTSTRAP_COOKIE_NAME,
  ADMIN_BOOTSTRAP_MAX_AGE,
  ADMIN_SESSION_MAX_AGE,
  createAdminBootstrapToken,
  createAdminSessionToken,
  isMfaRequiredForRole,
  isAdminAuthConfigured,
} from "@/src/lib/admin-auth";
import { getAdminAccountByEmail, rehashAdminAccountPassword } from "@/src/lib/admin-settings";
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
import { recordLoginAudit } from "@/src/lib/login-audit";
import { replaceAdminMfaEnrollment } from "@/src/lib/admin-mfa-enrollment";
import { getAdminAuthStep } from "@/src/lib/admin-mfa-policy";

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
    await recordLoginAudit({ actorType: "admin", email: normalizedEmail, success: false, reason: "rate_limited", headers: request.headers });
    const response = loginError(request, "locked");
    response.headers.set("Retry-After", String(block.retryAfterSeconds));
    return response;
  }

  const settings = await getAdminAccountByEmail(normalizedEmail);

  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(
      publicUrl(request, "/admin/login?error=setup"),
      { status: 303 }
    );
  }

  if (
    !settings?.isActive ||
    settings.role !== "admin" ||
    !settings.passwordHash ||
    !verifyPassword(password, settings.passwordHash)
  ) {
    const blockedUntil = await recordLoginFailure(clientIp, normalizedEmail);
    await recordLoginAudit({ actorType: "admin", email: normalizedEmail, success: false, reason: "invalid_credentials", headers: request.headers });
    return loginError(request, blockedUntil ? "locked" : "credentials");
  }

  const authStep = getAdminAuthStep({
    passwordAccepted: true,
    mfaRequired: isMfaRequiredForRole("admin"),
    mfaEnrolled: settings.totpEnabled,
    mustChangePassword: settings.mustChangePassword,
  });

  if (
    authStep === "mfa-challenge" &&
    (!settings.totpSecret || !verifyTotpCode(settings.totpSecret, totpCode))
  ) {
    const blockedUntil = await recordLoginFailure(clientIp, normalizedEmail);
    await recordLoginAudit({ actorType: "admin", email: normalizedEmail, success: false, reason: "invalid_2fa", headers: request.headers });
    return loginError(request, blockedUntil ? "locked" : "totp");
  }

  await clearLoginFailures(clientIp, normalizedEmail);
  await recordLoginAudit({ actorType: "admin", email: normalizedEmail, success: true, reason: "password", headers: request.headers });

  let sessionPasswordHash = settings.passwordHash;
  if (needsPasswordRehash(settings.passwordHash)) {
    sessionPasswordHash = hashPassword(password);
    await rehashAdminAccountPassword(settings.id, sessionPasswordHash);
  }

  if (authStep === "password-change" || authStep === "mfa-enroll") {
    const bootstrap = await createAdminBootstrapToken({
      accountId: settings.id,
      email: settings.email,
      passwordHash: sessionPasswordHash,
    });
    await replaceAdminMfaEnrollment(settings.id, bootstrap.tokenHash, new Date(bootstrap.session.expiresAt));
    const response = NextResponse.redirect(
      publicUrl(request, authStep === "password-change" ? "/admin/password" : "/admin/mfa-enroll"),
      { status: 303 }
    );
    response.cookies.set({
      name: ADMIN_BOOTSTRAP_COOKIE_NAME,
      value: bootstrap.token,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_BOOTSTRAP_MAX_AGE,
    });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    setNewAdminCsrfCookie(response);
    return response;
  }

  const response = NextResponse.redirect(publicUrl(request, redirectTo), {
    status: 303,
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await createAdminSessionToken({
      accountId: settings.id,
      email: settings.email,
      passwordHash: sessionPasswordHash,
      role: "admin",
      mustChangePassword: false,
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
