import "dotenv/config";

import { getAdminSettings, updateAdminSettings } from "@/src/lib/admin-settings";
import { hashPassword } from "@/src/lib/password";

async function main() {
  const settings = await getAdminSettings();
  const fallbackPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

  if (!settings) {
    throw new Error("Admin settings were not created.");
  }

  if (!settings.passwordHash && fallbackPassword) {
    await updateAdminSettings({ passwordHash: hashPassword(fallbackPassword) });
    console.log("Admin password hash initialized.");
  } else {
    console.log("Admin settings already initialized.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    // Drizzle keeps the pg pool alive; this script is intentionally short-lived.
    process.exit(0);
  });
