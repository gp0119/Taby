import type { EntityUid } from "@/type.ts"

const UID_LENGTH = 16
const UNBIASED_BYTE_LIMIT = 250

export function createEntityUid(): EntityUid {
  let uid = ""
  while (uid.length < UID_LENGTH) {
    const bytes = crypto.getRandomValues(
      new Uint8Array(UID_LENGTH - uid.length),
    )
    for (const byte of bytes) {
      if (byte >= UNBIASED_BYTE_LIMIT) continue
      uid += String(byte % 10)
    }
  }
  return uid
}

export function isEntityUid(value: unknown): value is EntityUid {
  return typeof value === "string" && /^\d{16}$/.test(value)
}
