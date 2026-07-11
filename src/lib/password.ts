import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const iterations = 120000;
const keyLength = 64;
const digest = "sha512";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest).toString(
    "hex"
  );

  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, iterationsText, salt, hash] = storedHash.split(":");

  if (method !== "pbkdf2" || !iterationsText || !salt || !hash) {
    return false;
  }

  const nextHash = pbkdf2Sync(
    password,
    salt,
    Number(iterationsText),
    keyLength,
    digest
  );
  const storedBuffer = Buffer.from(hash, "hex");

  if (storedBuffer.length !== nextHash.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, nextHash);
}
