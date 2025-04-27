import Dexie, { EntityTable, Transaction } from "dexie"
import { Card, Collection, Favicon, Label, Space, SyncData } from "@/type.ts"
import syncManager from "@/sync/syncManager.ts"
import { uuid } from "@/utils/index.ts"

class DataBase extends Dexie {
  private static instance: DataBase
  modifiedTables: Set<string> = new Set()
  spaces!: EntityTable<Space, "id">
  collections!: EntityTable<Collection, "id">
  labels!: EntityTable<Label, "id">
  cards!: EntityTable<Card, "id">
  favicons!: EntityTable<Favicon, "id">
  private unloadHandler: () => void

  constructor() {
    super("TabyDatabase")
    this.version(3)
      .stores({
        spaces: "++id, &uid, title, order, createdAt, icon",
        collections:
          "++id, &uid, title, spaceId, order, *labelIds, [spaceId+order], createdAt, icon",
        labels: "++id, &uid, title, color",
        cards:
          "++id, &uid, title, url, order, faviconId, description, collectionId, [collectionId+order], createdAt",
        favicons: "++id, &uid, url",
      })
      .upgrade(async (tx: Transaction) => {
        // Migration logic from v2 to v3
        console.log("Upgrading database to version 3...")

        // Generate UIDs and create mapping tables
        const idToUidSpaces = new Map<number, string>()
        await tx
          .table("spaces")
          .toCollection()
          .modify((space: Space) => {
            space.uid = uuid()
            idToUidSpaces.set(space.id, space.uid)
          })

        const idToUidLabels = new Map<number, string>()
        await tx
          .table("labels")
          .toCollection()
          .modify((label: Label) => {
            label.uid = uuid()
            idToUidLabels.set(label.id, label.uid)
          })

        const idToUidFavicons = new Map<number, string>()
        await tx
          .table("favicons")
          .toCollection()
          .modify((favicon: Favicon) => {
            favicon.uid = uuid()
            idToUidFavicons.set(favicon.id, favicon.uid)
          })

        const idToUidCollections = new Map<number, string>()
        await tx
          .table("collections")
          .toCollection()
          .modify(
            (
              collection: Collection & {
                _spaceId?: number
                _labelIds?: number[]
              },
            ) => {
              const newUid = uuid()
              collection.uid = newUid
              idToUidCollections.set(collection.id, newUid)

              const spaceUid = collection._spaceId
                ? idToUidSpaces.get(collection._spaceId)
                : undefined
              if (spaceUid === undefined) {
                console.warn(
                  `Migration: Could not find spaceUid for old spaceId ${collection._spaceId} in collection ${collection.id}. Setting spaceId to empty string.`,
                )
                collection.spaceId = ""
              } else {
                collection.spaceId = spaceUid
              }

              if (collection._labelIds && Array.isArray(collection._labelIds)) {
                collection.labelIds = collection._labelIds
                  .map((id) => idToUidLabels.get(id))
                  .filter((uid): uid is string => !!uid)
              } else {
                collection.labelIds = []
              }
            },
          )

        await tx
          .table("cards")
          .toCollection()
          .modify(
            (
              card: Card & {
                _collectionId?: number
                _faviconId?: number
              },
            ) => {
              const newUid = uuid()
              card.uid = newUid

              const collectionUid = card._collectionId
                ? idToUidCollections.get(card._collectionId)
                : undefined
              if (collectionUid === undefined) {
                console.warn(
                  `Migration: Could not find collectionUid for old collectionId ${card._collectionId} in card ${card.id}. Setting collectionId to empty string.`,
                )
                card.collectionId = ""
              } else {
                card.collectionId = collectionUid
              }

              const faviconUid = card._faviconId
                ? idToUidFavicons.get(card._faviconId)
                : undefined
              if (faviconUid === undefined && card._faviconId) {
                console.warn(
                  `Migration: Could not find faviconUid for old faviconId ${card._faviconId} in card ${card.id}. Setting faviconId to undefined.`,
                )
              }
              card.faviconId = faviconUid
            },
          )

        console.log(
          "Database upgrade to version 3 completed (using old field names with UIDs).",
        )
      })
    this.initializeDefaultData()
    this.addHooks()

    // 添加页面卸载时的清理
    this.unloadHandler = this.cleanup.bind(this)
    window.addEventListener("beforeunload", this.unloadHandler)
  }

  public static getInstance(): DataBase {
    if (!DataBase.instance || DataBase.instance.isOpen() === false) {
      DataBase.instance = new DataBase()
    }
    return DataBase.instance
  }

  private async createDefaultSpace() {
    const newUid = uuid()
    await this.spaces.add({
      title: "My Collections",
      order: 1000,
      createdAt: Date.now(),
      icon: "StorefrontOutline",
      uid: newUid,
    })
    await this.clearModifiedTable()
  }

  async addModifiedTable(tableName: string) {
    this.modifiedTables.add(tableName)
    localStorage.setItem(
      "modifiedTables",
      JSON.stringify([...this.modifiedTables]),
    )
  }

  async clearModifiedTable() {
    this.modifiedTables.clear()
    localStorage.removeItem("modifiedTables")
  }

  private async initializeDefaultData() {
    const spaceCount = await this.spaces.count()
    if (spaceCount === 0) {
      try {
        await this.createDefaultSpace()
      } catch (error) {
        console.error("初始化默认数据失败:", error)
      }
    }
  }

  async triggerUpload() {
    await syncManager.triggerUpload()
  }

  addHooks() {
    const tableMapping = [
      { table: this.spaces, name: "spaces" },
      { table: this.collections, name: "collections" },
      { table: this.labels, name: "labels" },
      { table: this.cards, name: "cards" },
      { table: this.favicons, name: "favicons" },
    ]
    const self = this
    tableMapping.forEach(({ table, name }) => {
      table.hook("creating", function () {
        // console.log("creating", name, obj)
        self.addModifiedTable(name)
        self.triggerUpload()
      })
      table.hook("updating", function () {
        // console.log("updating")
        self.addModifiedTable(name)
        self.triggerUpload()
      })
      table.hook("deleting", function () {
        // console.log("deleting")
        self.addModifiedTable(name)
        self.triggerUpload()
      })
    })
  }

  async getModifiedTables() {
    const modifiedData: Partial<SyncData> = {}
    const modifiedTables = JSON.parse(
      localStorage.getItem("modifiedTables") || "[]",
    )
    console.log("modifiedTables: ", modifiedTables)
    for (const tableName of modifiedTables) {
      const table = this[tableName as keyof DataBase]
      modifiedData[tableName as keyof SyncData] = await (
        table as EntityTable<any, any>
      ).toArray()
    }
    return modifiedData
  }

  async exportData(): Promise<SyncData> {
    const spaces = await this.spaces.toArray()
    const collections = await this.collections.toArray()
    const labels = await this.labels.toArray()
    const cards = await this.cards.toArray()
    const favicons = await this.favicons.toArray()
    return {
      spaces: spaces.map((space) => ({
        id: space.id,
        uid: space.uid,
        title: space.title,
        icon: space.icon,
        order: space.order,
        createdAt: space.createdAt,
      })),
      collections: collections.map((collection) => ({
        id: collection.id,
        uid: collection.uid,
        title: collection.title,
        spaceId: collection.spaceId,
        order: collection.order,
        labelIds: collection.labelIds,
        createdAt: collection.createdAt,
        icon: collection.icon,
      })),
      labels: labels.map((label) => ({
        id: label.id,
        uid: label.uid,
        title: label.title,
        color: label.color,
      })),
      cards: cards.map((card) => ({
        id: card.id,
        uid: card.uid,
        title: card.title,
        customTitle: card.customTitle,
        customDescription: card.customDescription,
        url: card.url,
        description: card.description,
        order: card.order,
        faviconId: card.faviconId,
        collectionId: card.collectionId,
        createdAt: card.createdAt,
      })),
      favicons: favicons.map((favicon) => ({
        id: favicon.id,
        uid: favicon.uid,
        url: favicon.url,
      })),
    }
  }

  private stripMetadata<
    T extends { createdAt?: number; id?: number; uid?: string },
  >(obj: T, additionalFields: (keyof T)[] = []): Partial<T> {
    const { createdAt, id, uid, ...rest } = obj
    const result = { ...rest } as Partial<T>
    additionalFields.forEach((field) => {
      if (field in result) {
        delete result[field]
      }
    })
    return result
  }

  async exportBySpaceId(spaceIds: string[]) {
    const spaces = await this.spaces
      .where("uid")
      .anyOf(spaceIds)
      .sortBy("order")
    const labels = await this.labels.toArray()
    const labelsMap = new Map(labels.map((label) => [label.uid, label]))
    const favicons = await this.favicons.toArray()
    const faviconsMap = new Map(
      favicons.map((favicon) => [favicon.uid, favicon.url]),
    )
    return Promise.all(
      spaces.map(async (space) => {
        const spaceData = this.stripMetadata(space, ["order", "id"])
        const collections = await this.collections
          .where({ spaceId: space.uid })
          .sortBy("order")

        const spaceCollections = await Promise.all(
          collections.map(async (collection) => {
            const collectionCards = await this.cards
              .where({ collectionId: collection.uid })
              .sortBy("order")

            return {
              ...this.stripMetadata(collection, [
                "order",
                "id",
                "labelIds",
                "spaceId",
              ]),
              labels: collection.labelIds
                .map((labelUid) => {
                  const label = labelsMap.get(labelUid)
                  return label ? this.stripMetadata(label, ["id"]) : null
                })
                .filter((l) => l !== null),
              cards: await Promise.all(
                collectionCards.map(async (card) => {
                  return {
                    ...this.stripMetadata(card, [
                      "order",
                      "id",
                      "collectionId",
                      "faviconId",
                    ]),
                    favicon: card.faviconId
                      ? faviconsMap.get(card.faviconId)
                      : "",
                  }
                }),
              ),
            }
          }),
        )

        return {
          ...spaceData,
          collections: spaceCollections,
        }
      }),
    )
  }

  async clearData() {
    await Promise.all([
      this.spaces.clear(),
      this.collections.clear(),
      this.labels.clear(),
      this.cards.clear(),
      this.favicons.clear(),
    ])
  }

  async importData(data: SyncData) {
    // This version handles potential inconsistencies in input data:
    // - It generates UIDs for records missing them.
    // - It uses original numeric IDs (assumed to be in data.spaces[x].id etc.)
    //   to map relationships (like collection.spaceId) to the final UIDs determined during this import.
    // - This temporarily ignores the stricter SyncData type definition where relation fields are strings.

    // Type assertion to work with potentially numeric IDs in relationship fields from source
    type InputCollection = Omit<Collection, "spaceId" | "labelIds"> & {
      spaceId?: number
      labelIds?: number[]
    }
    type InputCard = Omit<Card, "collectionId" | "faviconId"> & {
      collectionId?: number
      faviconId?: number
    }
    type TempSyncData = {
      spaces: Space[]
      collections: InputCollection[]
      labels: Label[]
      cards: InputCard[]
      favicons: Favicon[]
    }
    const tempData = data as unknown as TempSyncData

    this.transaction(
      "rw",
      [this.spaces, this.collections, this.labels, this.cards, this.favicons],
      async () => {
        await Promise.all([
          this.spaces.clear(),
          this.collections.clear(),
          this.labels.clear(),
          this.cards.clear(),
          this.favicons.clear(),
        ])

        // --- First Pass: Assign/Generate Final UIDs & Build Original ID -> Final UID Maps ---
        const originalIdToFinalUidMapSpaces = new Map<number, string>()
        tempData.spaces.forEach((space) => {
          const finalUid = space.uid || uuid()
          space.uid = finalUid // Mutate object in array
          originalIdToFinalUidMapSpaces.set(space.id, finalUid)
        })

        const originalIdToFinalUidMapLabels = new Map<number, string>()
        tempData.labels.forEach((label) => {
          const finalUid = label.uid || uuid()
          label.uid = finalUid
          originalIdToFinalUidMapLabels.set(label.id, finalUid)
        })

        const originalIdToFinalUidMapFavicons = new Map<number, string>()
        tempData.favicons.forEach((favicon) => {
          const finalUid = favicon.uid || uuid()
          favicon.uid = finalUid
          originalIdToFinalUidMapFavicons.set(favicon.id, finalUid)
        })

        const originalIdToFinalUidMapCollections = new Map<number, string>()
        tempData.collections.forEach((collection) => {
          const finalUid = collection.uid || uuid()
          collection.uid = finalUid
          originalIdToFinalUidMapCollections.set(collection.id, finalUid)
        })

        // Cards don't need their own map if nothing refers to them by original ID
        tempData.cards.forEach((card) => {
          card.uid = card.uid || uuid()
        })

        // --- Second Pass: Prepare Data for bulkPut using Mapped Final UIDs ---

        const spacesToPut = tempData.spaces.map((space) => ({
          title: space.title,
          icon: space.icon,
          order: space.order || 0,
          createdAt: space.createdAt || Date.now(),
          uid: space.uid!, // Final UID
        }))

        const labelsToPut = tempData.labels.map((label) => ({
          title: label.title,
          color: label.color,
          uid: label.uid!, // Final UID
        }))

        // Determine used Favicons based on final UIDs
        const usedFinalFaviconUids = new Set<string>()
        tempData.cards.forEach((card) => {
          if (card.faviconId) {
            // Assuming card.faviconId is original numeric ID
            const finalFaviconUid = originalIdToFinalUidMapFavicons.get(
              card.faviconId,
            )
            if (finalFaviconUid) {
              usedFinalFaviconUids.add(finalFaviconUid)
            }
          }
        })

        const faviconsToPut = tempData.favicons
          .filter((favicon) => usedFinalFaviconUids.has(favicon.uid!)) // Filter by final UID
          .map((favicon) => ({
            url: favicon.url,
            uid: favicon.uid!, // Final UID
          }))

        const collectionsToPut = tempData.collections.map((collection) => {
          // Map relation IDs to final UIDs
          const finalSpaceUid = collection.spaceId
            ? originalIdToFinalUidMapSpaces.get(collection.spaceId)
            : undefined
          const finalLabelUids = (collection.labelIds || [])
            .map((labelId) => originalIdToFinalUidMapLabels.get(labelId))
            .filter((uid): uid is string => !!uid)

          return {
            title: collection.title,
            icon: collection.icon,
            order: collection.order || 0,
            createdAt: collection.createdAt || Date.now(),
            uid: collection.uid!, // Final UID for the collection itself
            spaceId: finalSpaceUid || "", // Use mapped final UID
            labelIds: finalLabelUids, // Use mapped final UIDs
          }
        })

        const cardsToPut = tempData.cards.map((card) => {
          // Map relation IDs to final UIDs
          const finalCollectionUid = card.collectionId
            ? originalIdToFinalUidMapCollections.get(card.collectionId)
            : undefined
          const finalFaviconUid = card.faviconId
            ? originalIdToFinalUidMapFavicons.get(card.faviconId)
            : undefined

          return {
            title: card.customTitle || card.title,
            url: card.url,
            description: card.customDescription || card.description || "",
            order: card.order || 0,
            createdAt: card.createdAt || Date.now(),
            uid: card.uid!, // Final UID for the card itself
            collectionId: finalCollectionUid || "", // Use mapped final UID
            faviconId: finalFaviconUid, // Use mapped final UID (can be undefined)
          }
        })

        // --- Perform Bulk Puts ---
        await this.spaces.bulkPut(spacesToPut)
        await this.labels.bulkPut(labelsToPut)
        await this.favicons.bulkPut(faviconsToPut)
        await this.collections.bulkPut(collectionsToPut)
        await this.cards.bulkPut(cardsToPut)

        await this.clearModifiedTable()
      },
    )
  }

  async cleanup() {
    try {
      // 清理事件监听器
      window.removeEventListener("beforeunload", this.unloadHandler)
      await this.close()
      // 清理单例实例
      if (DataBase.instance) {
        DataBase.instance = undefined as any
      }
    } catch (error) {
      console.error("Database cleanup failed:", error)
    }
  }
}

export const db = DataBase.getInstance()
