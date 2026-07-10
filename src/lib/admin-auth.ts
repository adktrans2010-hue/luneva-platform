export const ADMIN_COOKIE_NAME = "luneva_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() || getAdminPassword();
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
  return getAdminPassword().length > 0;
}

export function isValidAdminPassword(password: string) {
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return false;
  }

  return equalTokens(password, adminPassword);
}

export async function createAdminSessionToken() {
  const payload = `luneva-admin:${getAdminPassword()}:${getAdminSessionSecret()}`;
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

  return equalTokens(token, await createAdminSessionToken());
}
