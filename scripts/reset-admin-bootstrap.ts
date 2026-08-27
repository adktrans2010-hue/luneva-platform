import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { adminMfaEnrollments, adminSettings, loginAuditLogs } from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { hashPassword } from "@/src/lib/password";

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/u.test(email)) throw new Error("A valid administrator email is required");
  if (!isEmailConfigured()) throw new Error("Email delivery is not configured");

  const [account] = await db.select().from(adminSettings).where(eq(adminSettings.email, email)).limit(1);
  if (!account || !account.isActive || account.role !== "admin") throw new Error("Active administrator account not found");
  if (account.totpEnabled || account.totpSecret) throw new Error("Refusing to reset an enrolled MFA account");
  if (!account.mustChangePassword) throw new Error("Refusing to reset a completed administrator account");

  const temporaryPassword = randomBytes(24).toString("base64url");
  const previousPasswordHash = account.passwordHash;
  const nextPasswordHash = hashPassword(temporaryPassword);

  await db
    .update(adminSettings)
    .set({ passwordHash: nextPasswordHash, mustChangePassword: true, updatedAt: new Date() })
    .where(eq(adminSettings.id, account.id));
  try {
    await db.delete(adminMfaEnrollments).where(eq(adminMfaEnrollments.accountId, account.id));
    await sendMail({
      to: email,
      subject: "Новый временный пароль администратора Luneva Psy",
      text: [
        "Для продолжения безопасной настройки администратора выпущен новый временный пароль.",
        `Логин: ${email}`,
        `Временный пароль: ${temporaryPassword}`,
        "Используйте только это, самое последнее письмо. После входа установите новый пароль и настройте MFA.",
        "Страница входа: https://luneva-psy.ru/admin/login",
      ].join("\n"),
    });
    await db.insert(loginAuditLogs).values({
      actorType: "admin_provisioning",
      email,
      ipAddress: "system",
      success: true,
      reason: "bootstrap_password_rotated",
      userAgent: "Codex Phase 2 MFA recovery",
    });
  } catch (error) {
    await db
      .update(adminSettings)
      .set({ passwordHash: previousPasswordHash, mustChangePassword: true, updatedAt: new Date() })
      .where(eq(adminSettings.id, account.id));
    throw error;
  }
  console.log("ADMIN_BOOTSTRAP_RESET=PASS email_delivery=sent mfa_enrolled=false");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Administrator bootstrap reset failed");
  process.exitCode = 1;
});
