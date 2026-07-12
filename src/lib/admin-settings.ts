import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { adminSettings } from "@/src/db/schema";
import { hashPassword } from "@/src/lib/password";

const ADMIN_SETTINGS_ID = "main";

export type AdminSettings = typeof adminSettings.$inferSelect;

function getFallbackEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function getFallbackPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

export async function getAdminSettings() {
  const [settings] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.id, ADMIN_SETTINGS_ID))
    .limit(1);

  if (settings) {
    return settings;
  }

  const fallbackEmail = getFallbackEmail();
  const fallbackPassword = getFallbackPassword();

  if (!fallbackEmail || !fallbackPassword) {
    return null;
  }

  const [created] = await db
    .insert(adminSettings)
    .values({
      id: ADMIN_SETTINGS_ID,
      email: fallbackEmail,
      passwordHash: hashPassword(fallbackPassword),
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return created;
  }

  const [nextSettings] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.id, ADMIN_SETTINGS_ID))
    .limit(1);

  return nextSettings ?? null;
}

export async function updateAdminSettings(values: {
  email?: string;
  phone?: string | null;
  passwordHash?: string | null;
  totpSecret?: string | null;
  totpEnabled?: boolean;
}) {
  await getAdminSettings();

  const [settings] = await db
    .update(adminSettings)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(adminSettings.id, ADMIN_SETTINGS_ID))
    .returning();

  return settings;
}
