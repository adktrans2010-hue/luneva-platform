export const ADMIN_COOKIE_NAME = "luneva_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60;

export const ADMIN_ROLES = ["admin", "editor", "assistant"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

const ADMIN_SESSION_VERSION = 1;
const PRIMARY_ADMIN_SUBJECT = "alexandra";

export type AdminSession = {
  version: typeof ADMIN_SESSION_VERSION;
  subject: string;
  email: string;
  role: AdminRole;
  credentialVersion: string;
  expiresAt: number;
};

export type AdminAuthorization =
  | { authorized: true; session: AdminSession }
  | { authorized: false; reason: "unauthenticated" | "forbidden" };

function getAdminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function getAdminSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    ""
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function stringToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlToString(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function createSigningKey() {
  const secret = getAdminSessionSecret();
  if (!secret) throw new Error("Admin session secret is not configured");

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function getCredentialVersion(passwordHash: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(passwordHash)
  );

  return bytesToBase64Url(new Uint8Array(digest));
}

function isAdminRole(value: unknown): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function isAdminAuthConfigured() {
  return getAdminEmail().length > 0 || Boolean(getAdminSessionSecret());
}

async function signAdminSession(payload: AdminSession) {
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await createSigningKey(),
    new TextEncoder().encode(encodedPayload)
  );

  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function createAdminSessionToken(options: {
  email: string;
  passwordHash: string;
  role?: AdminRole;
}) {
  const payload: AdminSession = {
    version: ADMIN_SESSION_VERSION,
    subject: PRIMARY_ADMIN_SUBJECT,
    email: options.email.trim().toLowerCase(),
    role: options.role ?? "admin",
    credentialVersion: await getCredentialVersion(options.passwordHash),
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };

  return signAdminSession(payload);
}

export async function renewAdminSessionToken(session: AdminSession) {
  return signAdminSession({
    ...session,
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  });
}

async function readAdminSession(token?: string): Promise<AdminSession | null> {
  if (!token || !isAdminAuthConfigured()) return null;

  try {
    const [encodedPayload, encodedSignature, extraPart] = token.split(".");
    if (!encodedPayload || !encodedSignature || extraPart) return null;

    const signatureIsValid = await crypto.subtle.verify(
      "HMAC",
      await createSigningKey(),
      base64UrlToBytes(encodedSignature),
      new TextEncoder().encode(encodedPayload)
    );
    if (!signatureIsValid) return null;

    const session = JSON.parse(base64UrlToString(encodedPayload)) as AdminSession;
    if (
      session.version !== ADMIN_SESSION_VERSION ||
      session.subject !== PRIMARY_ADMIN_SUBJECT ||
      !session.email ||
      !isAdminRole(session.role) ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    const { getAdminSettings } = await import("@/src/lib/admin-settings");
    const settings = await getAdminSettings();
    if (
      !settings?.passwordHash ||
      session.email !== settings.email.trim().toLowerCase() ||
      session.credentialVersion !==
        (await getCredentialVersion(settings.passwordHash))
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function authorizeAdminSession(
  token: string | undefined,
  allowedRoles: readonly AdminRole[] = ["admin"]
): Promise<AdminAuthorization> {
  const session = await readAdminSession(token);
  if (!session) return { authorized: false, reason: "unauthenticated" };

  if (!allowedRoles.includes(session.role)) {
    return { authorized: false, reason: "forbidden" };
  }

  return { authorized: true, session };
}

export async function isValidAdminSession(token?: string) {
  return (await authorizeAdminSession(token, ["admin"])).authorized;
}
