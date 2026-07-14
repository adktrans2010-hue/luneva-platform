import type { NextRequest, NextResponse } from "next/server";

import { ADMIN_CSRF_COOKIE_NAME } from "@/src/lib/admin-security-constants";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equalTokens(left?: string, right?: string) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function isUnsafeRequest(request: NextRequest) {
  return unsafeMethods.has(request.method.toUpperCase());
}

function getAllowedRequestOrigins(request: NextRequest) {
  const origins = new Set([request.nextUrl.origin]);
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  for (const value of [
    configuredUrl,
    process.env.NODE_ENV === "production" ? "https://luneva-psy.ru" : undefined,
  ]) {
    if (!value) continue;

    try {
      origins.add(new URL(value).origin);
    } catch {
      // Invalid configuration must not disable source validation.
    }
  }

  return origins;
}

export function hasValidRequestSource(request: NextRequest) {
  if (!isUnsafeRequest(request)) return true;

  const allowedOrigins = getAllowedRequestOrigins(request);
  const origin = request.headers.get("origin");
  if (origin) return allowedOrigins.has(origin);

  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return allowedOrigins.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export function ensureAdminCsrfCookie(
  request: NextRequest,
  response: NextResponse
) {
  const current = request.cookies.get(ADMIN_CSRF_COOKIE_NAME)?.value;
  const token = current && current.length === 64 ? current : randomToken();

  response.cookies.set({
    name: ADMIN_CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });

  return token;
}

export function setNewAdminCsrfCookie(response: NextResponse) {
  const token = randomToken();
  response.cookies.set({
    name: ADMIN_CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60,
  });
  return token;
}

export async function hasValidCsrfToken(request: NextRequest) {
  if (!isUnsafeRequest(request)) return true;

  const cookieToken = request.cookies.get(ADMIN_CSRF_COOKIE_NAME)?.value;
  let submittedToken = request.headers.get("x-csrf-token") ?? "";

  if (!submittedToken) {
    const contentType = request.headers.get("content-type") ?? "";
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      try {
        const formData = await request.clone().formData();
        submittedToken = String(formData.get("_csrf") ?? "");
      } catch {
        return false;
      }
    }
  }

  return equalTokens(cookieToken, submittedToken);
}
