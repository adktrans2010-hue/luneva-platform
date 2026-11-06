import "dotenv/config";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { getRecoveryClinicalAdminBootstrapConfig } from "@/scripts/clinical-admin-recovery-bootstrap";
import { db } from "@/src/db";
import { adminSettings, loginAuditLogs } from "@/src/db/schema";
import { isEmailConfigured, sendMail } from "@/src/lib/email";
import { hashPassword } from "@/src/lib/password";
import { bootstrapRedactor, smtpFailureLines, smtpPresence } from "./clinical-bootstrap-diagnostics";

const diagnosticSecrets: string[] = [];

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const config = getRecoveryClinicalAdminBootstrapConfig();
  console.log("BOOTSTRAP STAGE: guard-ok");

  if (dryRun) {
    console.log("RECOVERY_CLINICAL_ADMIN_BOOTSTRAP: DRY RUN PASS role=clinical_admin");
    return;
  }

  const [existing] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.email, config.email))
    .limit(1);
  console.log("BOOTSTRAP STAGE: db-ready");

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

  console.log(smtpPresence(process.env));
  if (!isEmailConfigured()) throw new Error("Email delivery is not configured");

  const acceptanceBaseUrl = process.env.ADMIN_ACCEPTANCE_BASE_URL?.replace(/\/$/u, "");
  if (!acceptanceBaseUrl || !/^https:\/\//u.test(acceptanceBaseUrl)) {
    throw new Error("A HTTPS ADMIN_ACCEPTANCE_BASE_URL is required for new clinical administrator delivery");
  }

  const temporaryPassword = randomBytes(24).toString("base64url");
  const passwordHash = hashPassword(temporaryPassword);
  diagnosticSecrets.push(temporaryPassword, passwordHash);
  const id = `clinical-admin-${randomBytes(12).toString("hex")}`;
  await db.insert(adminSettings).values({
    id,
    email: config.email,
    passwordHash,
    role: "clinical_admin",
    isActive: true,
    mustChangePassword: true,
  });
  console.log("BOOTSTRAP STAGE: account-created");

  let emailSent = false;
  try {
    console.log("BOOTSTRAP STAGE: smtp-start");
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
    } catch (error) {
      for (const line of smtpFailureLines(error, bootstrapRedactor(process.env, diagnosticSecrets))) console.error(line);
      throw new Error("Bootstrap email delivery failed; see safe SMTP diagnostics");
    }
    emailSent = true;
    console.log("BOOTSTRAP STAGE: smtp-sent");
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
    if (!emailSent) console.log("BOOTSTRAP STAGE: rollback-after-email-failure");
    throw error;
  }

  console.log("BOOTSTRAP STAGE: committed");
  console.log("CLINICAL_ADMIN_RECOVERY=CREATED role=clinical_admin active=true must_change_password=true email_delivery=sent");
}

main().catch((error) => {
  // SQL errors may contain bound parameters. Do not print those at the outer boundary.
  console.error(`Clinical administrator recovery bootstrap failed (${bootstrapRedactor(process.env, diagnosticSecrets)(error instanceof Error ? error.name : "Error")}); check last bootstrap stage`);
  process.exitCode = 1;
});
