import { NextRequest, NextResponse } from "next/server";

import {
  buildGoogleAuthorizationUrl,
  createGoogleCodeChallenge,
  createGoogleCodeVerifier,
  createGoogleOAuthState,
  getGoogleRedirectUri,
  GOOGLE_OAUTH_COOKIE_MAX_AGE,
  GOOGLE_OAUTH_NEXT_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  isGoogleAdminOAuthConfigured,
} from "@/src/lib/google-admin-oauth";
import { publicUrl } from "@/src/lib/public-url";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isGoogleAdminOAuthConfigured()) {
    return NextResponse.redirect(
      publicUrl(request, "/admin/login?error=google_setup")
    );
  }

  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/admin";
  const nextPath = requestedNext.startsWith("/admin") ? requestedNext : "/admin";
  const state = createGoogleOAuthState();
  const codeVerifier = createGoogleCodeVerifier();
  const response = NextResponse.redirect(
    buildGoogleAuthorizationUrl({
      redirectUri: getGoogleRedirectUri(request),
      state,
      codeChallenge: createGoogleCodeChallenge(codeVerifier),
    })
  );
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
  };

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_NEXT_COOKIE, nextPath, cookieOptions);

  return response;
}
