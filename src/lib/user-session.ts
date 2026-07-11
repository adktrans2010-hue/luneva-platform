export const USER_COOKIE_NAME = "luneva_user_session";
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getUserSessionSecret() {
  return (
    process.env.USER_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    "luneva-local-user-session"
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function equalTokens(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

async function signUserId(userId: string) {
  const payload = `luneva-user:${userId}:${getUserSessionSecret()}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(payload)
  );

  return toHex(digest);
}

export async function createUserSessionToken(userId: string) {
  return `${userId}.${await signUserId(userId)}`;
}

export async function getUserIdFromSession(token?: string) {
  const [userId, signature] = String(token ?? "").split(".");

  if (!userId || !signature) {
    return null;
  }

  return equalTokens(signature, await signUserId(userId)) ? userId : null;
}
