import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function normalizePassword(password: string) {
  return password.normalize("NFKC").toLocaleLowerCase("ru-RU");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(normalizePassword(password), salt, KEY_LENGTH).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(normalizePassword(password), salt, KEY_LENGTH);

  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}
