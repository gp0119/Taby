import Dexie, { EntityTable } from "dexie"
import { Card, Collection, Label, Space, SyncData } from "@/type.ts"
import syncManager from "@/sync/syncManager.ts"

class DataBase extends Dexie {
  private static instance: DataBase
  modifiedTables: Set<string> = new Set()
  spaces!: EntityTable<Space, "id">
  collections!: EntityTable<Collection, "id">
  labels!: EntityTable<Label, "id">
  cards!: EntityTable<Card, "id">
  constructor() {
    super("TabyDatabase")
    this.version(1.1).stores({
      spaces: "++id, title, order, createdAt, modifiedAt, icon",
      collections:
        "++id, title, spaceId, order, labelIds, [spaceId+order], createdAt, modifiedAt, icon",
      labels: "++id, title, color, createdAt, modifiedAt",
      cards:
        "++id, title, url, customTitle, order, favicon, customDescription, collectionId, [collectionId+order], createdAt, modifiedAt",
    })
    this.initializeDefaultData()
    this.addHooks()
  }

  public static getInstance(): DataBase {
    if (!DataBase.instance) {
      DataBase.instance = new DataBase()
    }
    return DataBase.instance
  }

  private async createDefaultSpace() {
    return this.spaces.add({
      title: "My Collections",
      order: 1000,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      icon: "StorefrontOutline",
    })
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
    ]
    const self = this
    tableMapping.forEach(({ table, name }) => {
      table.hook("creating", function (_primKey, obj) {
        // console.log("creating", obj)
        const now = Date.now()
        obj.createdAt = now
        obj.modifiedAt = now
        self.modifiedTables.add(name)
        self.triggerUpload()
      })
      table.hook("updating", function (modifications, _primKey, _obj) {
        // console.log("updating", modifications)
        if (typeof modifications === "object") {
          // @ts-ignore
          modifications.modifiedAt = Date.now()
          self.modifiedTables.add(name)
          self.triggerUpload()
        }
        return modifications
      })
      table.hook("deleting", function () {
        self.modifiedTables.add(name)
        self.triggerUpload()
      })
    })
  }

  async getModifiedTables() {
    const modifiedData: Partial<SyncData> = {}
    for (const tableName of this.modifiedTables) {
      const table = this[tableName as keyof DataBase]
      modifiedData[tableName as keyof SyncData] = await (
        table as EntityTable<any, any>
      ).toArray()
    }
    this.modifiedTables.clear()
    return modifiedData
  }

  async exportData() {
    const spaces = await this.spaces.toArray()
    const collections = await this.collections.toArray()
    const labels = await this.labels.toArray()
    const cards = await this.cards.toArray()
    return {
      spaces,
      collections,
      labels,
      cards,
    }
  }

  private stripMetadata<
    T extends { createdAt?: number; modifiedAt?: number; id?: number },
  >(obj: T, additionalFields: (keyof T)[] = []): Partial<T> {
    const { createdAt, modifiedAt, id, ...rest } = obj
    const result = { ...rest } as Partial<T>
    additionalFields.forEach((field) => {
      if (field in result) {
        delete result[field]
      }
    })
    return result
  }

  async exportBySpaceId(spaceIds: number[]) {
    const spaces = await this.spaces.where("id").anyOf(spaceIds).sortBy("order")
    return Promise.all(
      spaces.map(async (space) => {
        const spaceData = this.stripMetadata(space, ["order"])
        const collections = await this.collections
          .where({ spaceId: space.id })
          .sortBy("order")

        const spaceCollections = await Promise.all(
          collections.map(async (collection) => {
            const collectionLabels = await this.labels
              .where("id")
              .anyOf(collection.labelIds)
              .toArray()

            const collectionCards = await this.cards
              .where({ collectionId: collection.id })
              .sortBy("order")

            return {
              ...this.stripMetadata(collection, [
                "order",
                "labelIds",
                "spaceId",
              ]),
              labels: collectionLabels.map((label) =>
                this.stripMetadata(label),
              ),
              cards: collectionCards.map((card) =>
                this.stripMetadata(card, ["order", "collectionId"]),
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
    ])
  }

  async importData(data: {
    spaces: Space[]
    collections: Collection[]
    labels: Label[]
    cards: Card[]
  }) {
    this.transaction(
      "rw",
      [this.spaces, this.collections, this.labels, this.cards],
      async () => {
        await this.clearData()
        await this.spaces.bulkPut(data.spaces)
        await this.collections.bulkPut(data.collections)
        await this.labels.bulkPut(data.labels)
        await this.cards.bulkPut(data.cards)
        this.modifiedTables.clear()
      },
    )
  }
}

export const db = DataBase.getInstance()
