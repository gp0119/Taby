import Dexie, { EntityTable, Transaction } from "dexie"
import { Card, Collection, Favicon, Label, Space, SyncData } from "@/type.ts"
import syncManager from "@/sync/syncManager.ts"

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
    this.version(2)
      .stores({
        spaces: "++id, title, order, createdAt, icon",
        collections:
          "++id, title, spaceId, order, labelIds, [spaceId+order], createdAt, icon",
        labels: "++id, title, color",
        cards:
          "++id, title, url, order, faviconId, description, collectionId, [collectionId+order], createdAt",
        favicons: "++id, url",
      })
      .upgrade((tx: Transaction) => {
        this.handleCards(tx)
      })
    this.initializeDefaultData()
    this.addHooks()

    // 添加页面卸载时的清理
    this.unloadHandler = this.cleanup.bind(this)
    window.addEventListener("beforeunload", this.unloadHandler)
  }

  async handleCards(tx: Transaction) {
    tx.table("cards")
      .toCollection()
      .modify(async (card: any) => {
        card.description = ""
        card.title = card.customTitle || card.title
        delete card.customDescription
        delete card.customTitle
      })
  }

  public static getInstance(): DataBase {
    if (!DataBase.instance || DataBase.instance.isOpen() === false) {
      DataBase.instance = new DataBase()
    }
    return DataBase.instance
  }

  private async createDefaultSpace() {
    await this.spaces.add({
      title: "My Collections",
      order: 1000,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      icon: "StorefrontOutline",
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

  async exportData() {
    const spaces = await this.spaces.toArray()
    const collections = await this.collections.toArray()
    const labels = await this.labels.toArray()
    const cards = await this.cards.toArray()
    const favicons = await this.favicons.toArray()
    return {
      spaces: spaces.map((space) => ({
        id: space.id,
        title: space.title,
        icon: space.icon,
        order: space.order,
        createdAt: space.createdAt,
      })),
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        spaceId: collection.spaceId,
        order: collection.order,
        labelIds: collection.labelIds,
        createdAt: collection.createdAt,
      })),
      labels: labels.map((label) => ({
        id: label.id,
        title: label.title,
        color: label.color,
      })),
      cards: cards.map((card) => ({
        id: card.id,
        title: card.title,
        url: card.url,
        order: card.order,
        faviconId: card.faviconId,
        description: card.description,
        collectionId: card.collectionId,
        createdAt: card.createdAt,
      })),
      favicons: favicons.map((favicon) => ({
        id: favicon.id,
        url: favicon.url,
      })),
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
    const labels = await this.labels.toArray()
    const labelsMap = new Map(labels.map((label) => [label.id, label]))
    const favicons = await this.favicons.toArray()
    const faviconsMap = new Map(
      favicons.map((favicon) => [favicon.id, favicon.url]),
    )
    return Promise.all(
      spaces.map(async (space) => {
        const spaceData = this.stripMetadata(space, ["order"])
        const collections = await this.collections
          .where({ spaceId: space.id })
          .sortBy("order")

        const spaceCollections = await Promise.all(
          collections.map(async (collection) => {
            const collectionCards = await this.cards
              .where({ collectionId: collection.id })
              .sortBy("order")

            return {
              ...this.stripMetadata(collection, [
                "order",
                "labelIds",
                "spaceId",
              ]),
              labels: collection.labelIds.map((labelId) => {
                const label = labelsMap.get(labelId)
                return label ? this.stripMetadata(label) : null
              }),
              cards: await Promise.all(
                collectionCards.map(async (card) => {
                  return {
                    ...this.stripMetadata(card, [
                      "order",
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

  async importData(data: {
    spaces: Space[]
    collections: Collection[]
    labels: Label[]
    cards: Card[]
    favicons: Favicon[]
  }) {
    this.transaction(
      "rw",
      [this.spaces, this.collections, this.labels, this.cards, this.favicons],
      async () => {
        await this.clearData()
        await this.spaces.bulkPut(
          data.spaces.map((space) => ({
            id: space.id,
            title: space.title,
            icon: space.icon,
            order: space.order || 0,
            createdAt: space.createdAt || Date.now(),
          })),
        )
        await this.collections.bulkPut(
          data.collections.map((collection) => ({
            id: collection.id,
            title: collection.title,
            spaceId: collection.spaceId,
            order: collection.order || 0,
            labelIds: collection.labelIds || [],
            createdAt: collection.createdAt || Date.now(),
          })),
        )
        await this.labels.bulkPut(
          data.labels.map((label) => ({
            id: label.id,
            title: label.title,
            color: label.color,
          })),
        )
        await this.favicons.bulkPut(data.favicons || [])
        await this.cards.bulkPut(
          data.cards.map((card) => ({
            id: card.id,
            title: card.customTitle || card.title,
            url: card.url,
            order: card.order || 0,
            description: card.customDescription || card.description || "",
            collectionId: card.collectionId || 0,
            faviconId: card.faviconId || 0,
            createdAt: card.createdAt || Date.now(),
          })),
        )
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
