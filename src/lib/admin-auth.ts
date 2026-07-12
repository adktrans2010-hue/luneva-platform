export const ADMIN_COOKIE_NAME = "luneva_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || "";
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function equalTokens(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

export function isAdminAuthConfigured() {
  return getAdminEmail().length > 0 || Boolean(process.env.ADMIN_SESSION_SECRET?.trim());
}

export async function createAdminSessionToken(passwordHash = "") {
  const payload = `luneva-admin:${passwordHash}:${getAdminSessionSecret()}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload)
  );

  return toHex(digest);
}

export async function isValidAdminSession(token?: string) {
  if (!token || !isAdminAuthConfigured()) {
    return false;
  }

  const { getAdminSettings } = await import("@/src/lib/admin-settings");
  const settings = await getAdminSettings();

  if (!settings?.passwordHash) {
    return false;
  }

  return equalTokens(token, await createAdminSessionToken(settings.passwordHash));
}
