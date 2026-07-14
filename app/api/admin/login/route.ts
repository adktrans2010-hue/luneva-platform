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

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const totpCode = String(formData.get("totpCode") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");
  const redirectTo = nextPath.startsWith("/admin") ? nextPath : "/admin";
  const settings = await getAdminSettings();

  if (!isAdminAuthConfigured() || !settings?.email) {
    return NextResponse.redirect(
      publicUrl(request, "/admin/login?error=setup"),
      { status: 303 }
    );
  }

  if (
    email.trim().toLowerCase() !== settings.email.trim().toLowerCase() ||
    !settings.passwordHash ||
    !verifyPassword(password, settings.passwordHash)
  ) {
    return NextResponse.redirect(
      publicUrl(request, "/admin/login?error=credentials"),
      { status: 303 }
    );
  }

  if (
    settings.totpEnabled &&
    (!settings.totpSecret || !verifyTotpCode(settings.totpSecret, totpCode))
  ) {
    return NextResponse.redirect(
      publicUrl(request, "/admin/login?error=totp"),
      { status: 303 }
    );
  }

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

  return response;
}
