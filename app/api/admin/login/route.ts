import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  isAdminAuthConfigured,
  isValidAdminPassword,
} from "@/src/lib/admin-auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");
  const redirectTo = nextPath.startsWith("/admin") ? nextPath : "/admin";

  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/login?error=setup", request.url),
      { status: 303 }
    );
  }

  if (!isValidAdminPassword(password)) {
    return NextResponse.redirect(
      new URL("/admin/login?error=password", request.url),
      { status: 303 }
    );
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 303,
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await createAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
