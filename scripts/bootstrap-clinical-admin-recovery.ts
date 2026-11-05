import "dotenv/config";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { getRecoveryClinicalAdminBootstrapConfig } from "@/scripts/clinical-admin-recovery-bootstrap";
import { db } from "@/src/db";
import { adminSettings, loginAuditLogs } from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { hashPassword } from "@/src/lib/password";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const config = getRecoveryClinicalAdminBootstrapConfig();

  if (dryRun) {
    console.log("RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: DRY RUN PASS role=clinical_admin");
    return;
  }

  const [existing] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.email, config.email))
    .limit(1);

  if (existing) {
    if (!existing.isActive) throw new Error("Refusing to modify an inactive administrator account");

    if (existing.role === "clinical_admin") {
      console.log("CLINICAL_ADMIN_RECOVERY=EXISTS role=clinical_admin active=true");
      return;
    }

    if (!config.allowRoleUpdate) {
      throw new Error("RECOVERY_CLINICAL_ADMIN_ALLOW_ROLE_UPDATE=true is required to change an existing role");
    }

    await db
      .update(adminSettings)
      .set({ role: "clinical_admin", updatedAt: new Date() })
      .where(eq(adminSettings.id, existing.id));
    await db.insert(loginAuditLogs).values({
      actorType: "clinical_admin_recovery",
      email: config.email,
      ipAddress: "system",
      success: true,
      reason: "role_updated",
      userAgent: "Railway recovery bootstrap",
    });
    console.log("CLINICAL_ADMIN_RECOVERY=UPDATED role=clinical_admin");
    return;
  }

  if (!isEmailConfigured()) throw new Error("Email delivery is not configured");

  const acceptanceBaseUrl = process.env.ADMIN_ACCEPTANCE_BASE_URL?.replace(/\/$/u, "");
  if (!acceptanceBaseUrl || !/^https:\/\//u.test(acceptanceBaseUrl)) {
    throw new Error("A HTTPS ADMIN_ACCEPTANCE_BASE_URL is required for new clinical administrator delivery");
  }

  const temporaryPassword = randomBytes(24).toString("base64url");
  const id = `clinical-admin-${randomBytes(12).toString("hex")}`;
  await db.insert(adminSettings).values({
    id,
    email: config.email,
    passwordHash: hashPassword(temporaryPassword),
    role: "clinical_admin",
    isActive: true,
    mustChangePassword: true,
  });

  try {
    await sendMail({
      to: config.email,
      subject: "Доступ clinical administrator Luneva Psy",
      text: [
        "Для вас создана учётная запись clinical administrator Luneva Psy.",
        `Логин: ${config.email}`,
        `Временный пароль: ${temporaryPassword}`,
        "После первого входа установите новый пароль, затем подключите MFA.",
        `Страница входа: ${acceptanceBaseUrl}/admin/login`,
      ].join("\n"),
    });
    await db.insert(loginAuditLogs).values({
      actorType: "clinical_admin_recovery",
      email: config.email,
      ipAddress: "system",
      success: true,
      reason: "account_created",
      userAgent: "Railway recovery bootstrap",
    });
  } catch (error) {
    await db.delete(adminSettings).where(eq(adminSettings.id, id));
    throw error;
  }

  console.log("CLINICAL_ADMIN_RECOVERY=CREATED role=clinical_admin active=true must_change_password=true email_delivery=sent");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Clinical administrator recovery bootstrap failed");
  process.exitCode = 1;
});
