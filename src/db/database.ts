import Dexie, { EntityTable } from "dexie"
import { Card, Collection, Favicon, Label, Space, SyncData } from "@/type.ts"
import syncManager from "@/sync/syncManager.ts"
import { v4 as uuidv4, validate as uuidValidate } from "uuid"

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
    this.version(2).stores({
      spaces: "id, title, order, createdAt, icon",
      collections:
        "id, title, spaceId, order, labelIds, [spaceId+order], createdAt, icon",
      labels: "id, title, color",
      cards:
        "id, title, url, order, faviconId, description, collectionId, [collectionId+order], createdAt",
      favicons: "id, url",
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
    await this.spaces.add({
      id: uuidv4(),
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
    T extends { createdAt?: number; modifiedAt?: number; id?: number | string },
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

  async exportBySpaceId(spaceIds: string[]) {
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
              labels: (collection.labelIds || []).map((labelId) => {
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
    // 允许 Partial 并且 id 可以是 number 或 string
    spaces: Partial<Space & { id?: number | string }>[]
    collections: Partial<
      Collection & {
        id?: number | string
        spaceId?: number | string
        labelIds?: (number | string)[]
      }
    >[]
    labels: Partial<Label & { id?: number | string }>[]
    cards: Partial<
      Card & {
        id?: number | string
        collectionId?: number | string
        faviconId?: number | string
      }
    >[]
    favicons: Partial<Favicon & { id?: number | string }>[]
  }) {
    try {
      await Promise.all([
        this.spaces.clear(),
        this.collections.clear(),
        this.labels.clear(),
        this.cards.clear(),
        this.favicons.clear(),
      ])
      // 1. 处理并生成/验证 ID，同时创建旧 ID 到新 ID 的映射
      const oldSpaceIdMap = new Map<string | number, string>()
      const spaces = data.spaces.map((space) => {
        const oldId = space.id
        // 检查旧 ID 是否是有效的 UUID string
        const newId =
          typeof oldId === "string" && uuidValidate(oldId) ? oldId : uuidv4()
        if (oldId !== undefined) {
          oldSpaceIdMap.set(oldId, newId)
        }
        return { ...space, id: newId } as Space
      })

      const oldCollectionIdMap = new Map<string | number, string>()
      const collections = data.collections.map((collection) => {
        const oldId = collection.id
        const newId =
          typeof oldId === "string" && uuidValidate(oldId) ? oldId : uuidv4()
        if (oldId !== undefined) {
          oldCollectionIdMap.set(oldId, newId)
        }
        // 同时转换 spaceId
        const oldSpaceId = collection.spaceId
        const newSpaceId =
          oldSpaceId !== undefined && oldSpaceIdMap.has(oldSpaceId)
            ? oldSpaceIdMap.get(oldSpaceId)!
            : String(oldSpaceId || "")
        // 暂存旧 labelIds，后面处理
        const oldLabelIds = collection.labelIds || []
        return {
          ...collection,
          id: newId,
          spaceId: newSpaceId,
          labelIds: oldLabelIds,
        } as Collection // labelIds 暂时用旧的
      })

      const oldLabelIdMap = new Map<string | number, string>()
      const labels = data.labels.map((label) => {
        const oldId = label.id
        const newId =
          typeof oldId === "string" && uuidValidate(oldId) ? oldId : uuidv4()
        if (oldId !== undefined) {
          oldLabelIdMap.set(oldId, newId)
        }
        return { ...label, id: newId } as Label
      })

      // 再次处理 collections，用 label map 更新 labelIds
      collections.forEach((collection) => {
        if (Array.isArray(collection.labelIds)) {
          collection.labelIds = (collection.labelIds as (string | number)[]) // 类型断言
            .map((oldLabelId) => {
              // 使用映射转换 label ID
              if (oldLabelId !== undefined && oldLabelIdMap.has(oldLabelId)) {
                return oldLabelIdMap.get(oldLabelId)!
              }
              // 如果已经是 string 或无法映射，则保留 string
              return typeof oldLabelId === "string" ? oldLabelId : null
            })
            .filter((id): id is string => id !== null) // 过滤掉 null 或无法转换的
        }
      })

      const oldFaviconIdMap = new Map<string | number, string>()
      const faviconsMapByUrl = new Map<string, string>()
      const faviconsToAdd: Favicon[] = []
      data.favicons.forEach((favicon) => {
        const url = favicon.url?.trim()
        if (!url) return

        let newId: string
        let existingFavicon = faviconsMapByUrl.get(url)

        if (existingFavicon) {
          newId = existingFavicon // 复用基于 URL 找到的 ID
        } else {
          // URL 不存在，检查传入的 ID 是否是有效 UUID
          const oldId = favicon.id
          newId =
            typeof oldId === "string" && uuidValidate(oldId) ? oldId : uuidv4()
          faviconsMapByUrl.set(url, newId)
          faviconsToAdd.push({ ...favicon, id: newId, url } as Favicon)
        }

        // 记录旧 ID 到新 ID（或复用的 ID）的映射
        if (favicon.id !== undefined) {
          oldFaviconIdMap.set(favicon.id, newId)
        }
      })

      // 2. 处理 cards：始终生成新 ID，但使用映射查找正确的 *外键* ID
      const cards = data.cards.map((card) => {
        const cardId = uuidv4() // **始终为导入的 card 生成新 ID**

        // 查找新的 collectionId (使用 collection 的映射)
        const oldCollectionId = card.collectionId
        const newCollectionId =
          oldCollectionId !== undefined &&
          oldCollectionIdMap.has(oldCollectionId)
            ? oldCollectionIdMap.get(oldCollectionId)!
            : ""

        // 查找新的 faviconId (使用 favicon 的映射)
        let newFaviconId: string | undefined = undefined
        const oldFaviconId = card.faviconId
        if (oldFaviconId !== undefined && oldFaviconIdMap.has(oldFaviconId)) {
          newFaviconId = oldFaviconIdMap.get(oldFaviconId)!
        } else if (card.url) {
          newFaviconId = faviconsMapByUrl.get(card.url.trim())
        }

        return {
          ...card,
          id: cardId, // 使用新生成的 Card ID
          collectionId: newCollectionId,
          faviconId: newFaviconId,
          title: card.title || "",
          url: card.url || "",
          description: card.description || "",
          order: card.order || 0,
          createdAt: card.createdAt || Date.now(),
        } as Card
      })

      // 3. 使用 bulkPut 一次性导入所有处理过的数据
      await this.transaction(
        "rw",
        [this.spaces, this.collections, this.labels, this.cards, this.favicons],
        async () => {
          await this.spaces.bulkPut(spaces)
          await this.collections.bulkPut(collections)
          await this.labels.bulkPut(labels)
          await this.cards.bulkPut(cards)
          await this.favicons.bulkPut(faviconsToAdd)
        },
      )
    } catch (error) {
      console.error("导入数据失败:", error)
      throw error
    }
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
