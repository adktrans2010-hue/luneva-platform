import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_BOOTSTRAP_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  authorizeAdminBootstrap,
  createAdminSessionToken,
  hashAdminBootstrapToken,
} from "@/src/lib/admin-auth";
import { completeAdminMfaEnrollment, getActiveAdminMfaEnrollment, recordAdminMfaEnrollmentFailure } from "@/src/lib/admin-mfa-enrollment";
import { getAdminAccountById, updateAdminAccountMfa } from "@/src/lib/admin-settings";
import { clearLoginFailures, getLoginClientIp, recordLoginFailure } from "@/src/lib/admin-login-rate-limit";
import { setNewAdminCsrfCookie } from "@/src/lib/admin-security";
import { recordLoginAudit } from "@/src/lib/login-audit";
import { verifyTotpCode } from "@/src/lib/totp";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_BOOTSTRAP_COOKIE_NAME)?.value;
  const bootstrap = await authorizeAdminBootstrap(token);
  if (!token || !bootstrap) return NextResponse.json({ error: "Bootstrap authentication required" }, { status: 401 });
  const state = await getActiveAdminMfaEnrollment(bootstrap.accountId, await hashAdminBootstrapToken(token));
  const account = await getAdminAccountById(bootstrap.accountId);
  if (!state || state.attempts >= 5 || !account?.passwordHash || !account.totpSecret || account.totpEnabled) {
    return NextResponse.json({ error: "Enrollment state is invalid" }, { status: 409 });
  }
  const code = String((await request.formData()).get("totpCode") ?? "");
  if (!verifyTotpCode(account.totpSecret, code)) {
    await recordAdminMfaEnrollmentFailure(state.id, state.attempts);
    await recordLoginFailure(getLoginClientIp(request.headers), account.email);
    return NextResponse.json({ error: "Invalid TOTP" }, { status: 400 });
  }
  await updateAdminAccountMfa(account.id, { totpEnabled: true });
  await completeAdminMfaEnrollment(state.id);
  await clearLoginFailures(getLoginClientIp(request.headers), account.email);
  await recordLoginAudit({ actorType: "admin", email: account.email, success: true, reason: "mfa_enrolled", headers: request.headers });
  const response = NextResponse.json({ ok: true, next: "/admin/ai/knowledge" });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await createAdminSessionToken({ accountId: account.id, email: account.email, passwordHash: account.passwordHash, role: account.role as "admin" | "clinical_admin" }),
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: ADMIN_SESSION_MAX_AGE,
  });
  response.cookies.delete(ADMIN_BOOTSTRAP_COOKIE_NAME);
  setNewAdminCsrfCookie(response);
  return response;
}
