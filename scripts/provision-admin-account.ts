import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { adminSettings, loginAuditLogs } from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { hashPassword } from "@/src/lib/password";

async function main() {
  const email = String(process.argv[2] ?? "").trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/u.test(email)) throw new Error("A valid administrator email is required");
  if (!isEmailConfigured()) throw new Error("Email delivery is not configured");

  const [existing] = await db.select().from(adminSettings).where(eq(adminSettings.email, email)).limit(1);
  if (existing) {
    if (existing.role !== "admin" || !existing.isActive) {
      await db.update(adminSettings).set({ role: "admin", isActive: true, updatedAt: new Date() }).where(eq(adminSettings.id, existing.id));
    }
    console.log("ADMIN_ACCOUNT=EXISTS role=admin active=true");
    return;
  }

  const temporaryPassword = randomBytes(24).toString("base64url");
  const id = `admin-${randomBytes(12).toString("hex")}`;
  await db.insert(adminSettings).values({
    id,
    email,
    passwordHash: hashPassword(temporaryPassword),
    role: "admin",
    isActive: true,
    mustChangePassword: true,
  });
  try {
    const acceptanceBaseUrl = process.env.ADMIN_ACCEPTANCE_BASE_URL?.replace(/\/$/u, "");
    if (!acceptanceBaseUrl) throw new Error("Administrator acceptance URL is required");
    const form = new FormData();
    form.set("email", email);
    form.set("password", temporaryPassword);
    form.set("next", "/admin/ai/knowledge");
    const response = await fetch(`${acceptanceBaseUrl}/api/admin/login`, {
      method: "POST",
      headers: { origin: "https://luneva-psy.ru" },
      body: form,
      redirect: "manual",
    });
    if (response.status !== 303 || !response.headers.get("location")?.endsWith("/admin/password")) {
      throw new Error("New administrator login acceptance failed");
    }
    await sendMail({
      to: email,
      subject: "Доступ администратора Luneva Psy",
      text: [
        "Для вас создана учётная запись администратора Luneva Psy.",
        `Логин: ${email}`,
        `Временный пароль: ${temporaryPassword}`,
        "После первого входа система потребует установить новый пароль.",
        "Страница входа: https://luneva-psy.ru/admin/login",
      ].join("\n"),
    });
    await db.insert(loginAuditLogs).values({
      actorType: "admin_provisioning",
      email,
      ipAddress: "system",
      success: true,
      reason: "account_created",
      userAgent: "Codex Phase 2 deployment",
    });
  } catch (error) {
    await db.delete(adminSettings).where(eq(adminSettings.id, id));
    throw error;
  }
  console.log("ADMIN_ACCOUNT=CREATED role=admin active=true must_change_password=true email_delivery=sent");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Administrator provisioning failed");
  process.exitCode = 1;
});
