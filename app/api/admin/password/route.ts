import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_BOOTSTRAP_COOKIE_NAME,
  ADMIN_BOOTSTRAP_MAX_AGE,
  authorizeAdminBootstrap,
  createAdminBootstrapToken,
} from "@/src/lib/admin-auth";
import { getAdminAccountById, updateAdminAccountPassword } from "@/src/lib/admin-settings";
import { hashPassword, verifyPassword } from "@/src/lib/password";
import { replaceAdminMfaEnrollment } from "@/src/lib/admin-mfa-enrollment";

export async function POST(request: NextRequest) {
  const bootstrap = await authorizeAdminBootstrap(request.cookies.get(ADMIN_BOOTSTRAP_COOKIE_NAME)?.value);
  if (!bootstrap) return NextResponse.json({ error: "Bootstrap authentication required" }, { status: 401 });
  const form = await request.formData();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const account = await getAdminAccountById(bootstrap.accountId);
  if (!account?.passwordHash || !verifyPassword(currentPassword, account.passwordHash) || newPassword.length < 12) {
    return NextResponse.json({ error: "Invalid password change request" }, { status: 400 });
  }
  const updated = await updateAdminAccountPassword(account.id, hashPassword(newPassword));
  if (!updated?.passwordHash) return NextResponse.json({ error: "Account update failed" }, { status: 500 });
  const nextBootstrap = await createAdminBootstrapToken({ accountId: updated.id, email: updated.email, passwordHash: updated.passwordHash });
  await replaceAdminMfaEnrollment(updated.id, nextBootstrap.tokenHash, new Date(nextBootstrap.session.expiresAt));
  const response = NextResponse.json({ ok: true, next: "/admin/mfa-enroll" });
  response.cookies.set({
    name: ADMIN_BOOTSTRAP_COOKIE_NAME,
    value: nextBootstrap.token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_BOOTSTRAP_MAX_AGE,
  });
  return response;
}
