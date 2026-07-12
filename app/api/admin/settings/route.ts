import { NextRequest, NextResponse } from "next/server";

import { getAdminSettings, updateAdminSettings } from "@/src/lib/admin-settings";
import { hashPassword, verifyPassword } from "@/src/lib/password";
import { publicUrl } from "@/src/lib/public-url";
import { createTotpSecret, verifyTotpCode } from "@/src/lib/totp";

function redirectToSettings(request: NextRequest, status: string) {
  return NextResponse.redirect(
    publicUrl(request, `/admin/settings?status=${status}`),
    { status: 303 }
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "");
  const settings = await getAdminSettings();

  if (!settings) {
    return redirectToSettings(request, "setup-error");
  }

  if (action === "profile") {
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const phone = String(formData.get("phone") ?? "").trim() || null;

    if (!email || !email.includes("@")) {
      return redirectToSettings(request, "profile-error");
    }

    await updateAdminSettings({ email, phone });

    return redirectToSettings(request, "profile-saved");
  }

  if (action === "create-2fa") {
    await updateAdminSettings({
      totpSecret: createTotpSecret(),
      totpEnabled: false,
    });

    return redirectToSettings(request, "2fa-created");
  }

  if (action === "enable-2fa") {
    const code = String(formData.get("totpCode") ?? "");

    if (!settings.totpSecret || !verifyTotpCode(settings.totpSecret, code)) {
      return redirectToSettings(request, "2fa-code-error");
    }

    await updateAdminSettings({ totpEnabled: true });

    return redirectToSettings(request, "2fa-enabled");
  }

  if (action === "disable-2fa") {
    const password = String(formData.get("password") ?? "");

    if (!settings.passwordHash || !verifyPassword(password, settings.passwordHash)) {
      return redirectToSettings(request, "password-error");
    }

    await updateAdminSettings({ totpEnabled: false, totpSecret: null });

    return redirectToSettings(request, "2fa-disabled");
  }

  if (action === "password") {
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const nextPassword = String(formData.get("nextPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (
      !settings.passwordHash ||
      !verifyPassword(currentPassword, settings.passwordHash)
    ) {
      return redirectToSettings(request, "password-error");
    }

    if (nextPassword.length < 8 || nextPassword !== confirmPassword) {
      return redirectToSettings(request, "password-new-error");
    }

    await updateAdminSettings({ passwordHash: hashPassword(nextPassword) });

    return redirectToSettings(request, "password-saved");
  }

  return redirectToSettings(request, "unknown-action");
}
