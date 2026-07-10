import type { EntityUid } from "@/type.ts"

const UID_LENGTH = 12
const UID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

export function createEntityUid(): EntityUid {
  const bytes = crypto.getRandomValues(new Uint8Array(UID_LENGTH))
  return Array.from(bytes, (byte) => UID_ALPHABET[byte & 63]).join("")
}

export function isEntityUid(value: unknown): value is EntityUid {
  return typeof value === "string" && /^[A-Za-z0-9_-]{12}$/.test(value)
}
