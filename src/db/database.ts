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
    if (!DataBase.instance) {
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
    this.modifiedTables.clear()
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
        self.modifiedTables.add(name)
        self.triggerUpload()
      })
      table.hook("updating", function () {
        console.log("updating")
        self.modifiedTables.add(name)
        self.triggerUpload()
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
              cards: await Promise.all(
                collectionCards.map(async (card) => {
                  const faviconId = card.faviconId
                  const favicon = faviconId
                    ? await this.favicons.get(faviconId)
                    : ""
                  return {
                    ...this.stripMetadata(card, ["order", "collectionId"]),
                    favicon: favicon ? favicon.url : "",
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
            title: card.title,
            url: card.url,
            order: card.order || 0,
            description: card.description || "",
            collectionId: card.collectionId || 0,
            faviconId: card.faviconId || 0,
            createdAt: card.createdAt || Date.now(),
          })),
        )
        this.modifiedTables.clear()
      },
    )
  }
}

export const db = DataBase.getInstance()
