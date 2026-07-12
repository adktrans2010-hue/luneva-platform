import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function createTotpSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  let output = "";

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += alphabet[Number.parseInt(chunk, 2)];
  }

  return output;
}

function decodeBase32(secret: string) {
  const cleanSecret = secret.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  const bytes: number[] = [];

  for (const char of cleanSecret) {
    const value = alphabet.indexOf(char);

    if (value === -1) {
      throw new Error("Invalid base32 secret");
    }

    bits += value.toString(2).padStart(5, "0");
  }

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function createTotpCode(secret: string, step: number) {
  const key = decodeBase32(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));

  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}

function equalCodes(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyTotpCode(secret: string, code: string) {
  const cleanCode = code.trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (const offset of [-1, 0, 1]) {
    if (equalCodes(createTotpCode(secret, currentStep + offset), cleanCode)) {
      return true;
    }
  }

  return false;
}

export function createOtpAuthUrl(email: string, secret: string) {
  const label = encodeURIComponent(`Luneva Psy:${email}`);
  const issuer = encodeURIComponent("Luneva Psy");

  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
