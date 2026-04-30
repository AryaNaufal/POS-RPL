import { createHash, randomBytes, scryptSync } from "node:crypto";

const DEFAULT_RESET_TOKEN_TTL_MINUTES = 30;

export function normalizeEmail(value: string) {
  return String(value).trim().toLowerCase();
}

export function hashPassword(rawPassword: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(rawPassword, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function createPasswordResetTokenPair() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPasswordResetExpiryDate(minutes = DEFAULT_RESET_TOKEN_TTL_MINUTES) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}
