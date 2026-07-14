import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from "@/src/lib/admin-auth";
import { getAdminSettings } from "@/src/lib/admin-settings";
import {
  getAllowedGoogleAdminEmail,
  getGoogleRedirectUri,
  getGoogleUserInfo,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  isGoogleAdminOAuthConfigured,
  isMatchingGoogleOAuthState,
} from "@/src/lib/google-admin-oauth";
import { publicUrl } from "@/src/lib/public-url";
import { setNewAdminCsrfCookie } from "@/src/lib/admin-security";
import { recordLoginAudit } from "@/src/lib/login-audit";

export const runtime = "nodejs";

function clearOAuthCookies(response: NextResponse) {
  for (const name of [
    GOOGLE_OAUTH_STATE_COOKIE,
    GOOGLE_OAUTH_VERIFIER_COOKIE,
    GOOGLE_OAUTH_NEXT_COOKIE,
  ]) {
    response.cookies.set({ name, value: "", path: "/", maxAge: 0 });
  }
}

function loginError(request: NextRequest, error: string) {
  const response = NextResponse.redirect(
    publicUrl(request, `/admin/login?error=${error}`)
  );
  clearOAuthCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  if (!isGoogleAdminOAuthConfigured()) return loginError(request, "google_setup");

  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const expectedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;
  const requestedNext = request.cookies.get(GOOGLE_OAUTH_NEXT_COOKIE)?.value;
  const nextPath = requestedNext?.startsWith("/admin") ? requestedNext : "/admin";

  if (
    request.nextUrl.searchParams.has("error") ||
    !code ||
    !codeVerifier ||
    !isMatchingGoogleOAuthState(expectedState, state)
  ) {
    await recordLoginAudit({
      actorType: "admin",
      email: "unknown",
      success: false,
      reason: "google_state_or_code",
      headers: request.headers,
    });
    return loginError(request, "google");
  }

  try {
    const settings = await getAdminSettings();
    if (!settings?.email || !settings.passwordHash) {
      return loginError(request, "setup");
    }

    const user = await getGoogleUserInfo({
      code,
      codeVerifier,
      redirectUri: getGoogleRedirectUri(request),
    });
    const allowedEmail = getAllowedGoogleAdminEmail(settings.email);

    if (
      user.email_verified !== true ||
      user.email?.trim().toLowerCase() !== allowedEmail
    ) {
      await recordLoginAudit({
        actorType: "admin",
        email: user.email ?? "unknown",
        success: false,
        reason: "google_email_denied",
        headers: request.headers,
      });
      return loginError(request, "google_email");
    }

    const response = NextResponse.redirect(publicUrl(request, nextPath));
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: await createAdminSessionToken({
        email: allowedEmail,
        passwordHash: settings.passwordHash,
        role: "admin",
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    clearOAuthCookies(response);
    setNewAdminCsrfCookie(response);
    await recordLoginAudit({
      actorType: "admin",
      email: allowedEmail,
      success: true,
      reason: "google_oauth",
      headers: request.headers,
    });

    return response;
  } catch (error) {
    console.error("Google admin OAuth failed", error);
    await recordLoginAudit({
      actorType: "admin",
      email: "unknown",
      success: false,
      reason: "google_error",
      headers: request.headers,
    });
    return loginError(request, "google");
  }
}
