import type { SyncData } from "@/type"

export function validateSyncData(value: unknown): asserts value is SyncData {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid sync data")
  }
  const data = value as SyncData
  const ids = (rows: unknown, table: string) => {
    if (!Array.isArray(rows)) throw new Error(`Invalid sync table: ${table}`)
    const result = new Set<number>()
    for (const row of rows) {
      if (
        !row ||
        !Number.isSafeInteger(row.id) ||
        row.id <= 0 ||
        result.has(row.id) ||
        (table !== "favicons" && typeof row.title !== "string") ||
        (["spaces", "collections", "cards"].includes(table) &&
          !Number.isFinite(row.order))
      ) {
        throw new Error(`Invalid sync record: ${table}`)
      }
      result.add(row.id)
    }
    return result
  }
  const spaces = ids(data.spaces, "spaces")
  const collections = ids(data.collections, "collections")
  ids(data.labels, "labels")
  ids(data.cards, "cards")
  ids(data.favicons, "favicons")
  for (const collection of data.collections) {
    if (
      !spaces.has(collection.spaceId) ||
      !Array.isArray(collection.labelIds) ||
      !collection.labelIds.every((id) => Number.isSafeInteger(id) && id > 0)
    ) {
      throw new Error("Invalid sync collection references")
    }
  }
  for (const card of data.cards) {
    if (
      !collections.has(card.collectionId) ||
      typeof card.url !== "string" ||
      (card.description !== undefined && typeof card.description !== "string")
    ) {
      throw new Error("Invalid sync card")
    }
  }
  if (
    data.favicons.some((icon) => typeof icon.url !== "string") ||
    data.labels.some((label) => typeof label.color !== "string")
  ) {
    throw new Error("Invalid sync favicon or label")
  }
}
