import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { compareSync, hashSync } from "bcryptjs";

const keyLength = 64;
const digest = "sha512";
const bcryptRounds = 12;

export function hashPassword(password: string) {
  return hashSync(password, bcryptRounds);
}

export function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
    try {
      return compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

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

export function needsPasswordRehash(storedHash: string) {
  return !storedHash.startsWith("$2b$12$");
}
