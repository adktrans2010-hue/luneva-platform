import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { NextRequest } from "next/server";

import { publicUrl } from "@/src/lib/public-url";

export const GOOGLE_OAUTH_STATE_COOKIE = "luneva_google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "luneva_google_oauth_verifier";
export const GOOGLE_OAUTH_NEXT_COOKIE = "luneva_google_oauth_next";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 60 * 10;

const authorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
const tokenEndpoint = "https://oauth2.googleapis.com/token";
const userInfoEndpoint = "https://openidconnect.googleapis.com/v1/userinfo";

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
}

function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
}

export function isGoogleAdminOAuthConfigured() {
  return Boolean(getClientId() && getClientSecret());
}

export function getGoogleRedirectUri(request: NextRequest) {
  return (
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    publicUrl(request, "/api/admin/google/callback").toString()
  );
}

export function getAllowedGoogleAdminEmail(fallbackEmail: string) {
  return (
    process.env.GOOGLE_ADMIN_EMAIL?.trim().toLowerCase() ||
    fallbackEmail.trim().toLowerCase()
  );
}

export function createGoogleOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function createGoogleCodeVerifier() {
  return randomBytes(48).toString("base64url");
}

export function createGoogleCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function isMatchingGoogleOAuthState(expected?: string, received?: string) {
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function buildGoogleAuthorizationUrl(options: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(authorizationEndpoint);
  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", options.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function getGoogleUserInfo(options: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const tokenResponse = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code: options.code,
      code_verifier: options.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: options.redirectUri,
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed");
  }

  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Google access token is missing");

  const userResponse = await fetch(userInfoEndpoint, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });

  if (!userResponse.ok) throw new Error("Google user info request failed");

  return (await userResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
}
