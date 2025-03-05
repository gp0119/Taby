import Dexie, { EntityTable } from "dexie"
import { Card, Collection, Label, Space } from "@/type.ts"
import { uploadAll } from "@/sync/gistSync.ts"
import { debounce } from "lodash-es"

const SYNC_INTERVAL = 1000 * 30
const syncToGist = debounce(async () => {
  const { accessToken, gistId } = await chrome.storage.sync.get([
    "accessToken",
    "gistId",
  ])
  if (!accessToken || !gistId) return
  await uploadAll(accessToken, gistId)
}, SYNC_INTERVAL)

class DataBase extends Dexie {
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

  private async initializeDefaultData() {
    const spaceCount = await this.spaces.count()
    if (spaceCount === 0) {
      try {
        await this.spaces.add({
          title: "My Collections",
          order: 1000,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
          icon: "StorefrontOutline",
        })
      } catch (error) {
        console.error("初始化默认数据失败:", error)
      }
    }
  }

  addHooks() {
    const tables = [this.spaces, this.collections, this.labels, this.cards]
    tables.forEach((table) => {
      table.hook("creating", function (_primKey, obj) {
        // console.log("creating", obj)
        const now = Date.now()
        obj.createdAt = now
        obj.modifiedAt = now
        syncToGist()
      })
      table.hook("updating", function (modifications, _primKey, _obj) {
        // console.log("updating", modifications)
        if (typeof modifications === "object") {
          // @ts-ignore
          modifications.modifiedAt = Date.now()
          syncToGist()
        }
        return modifications
      })
    })
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
    await this.clearData()
    await this.spaces.bulkAdd(data.spaces)
    await this.collections.bulkAdd(data.collections)
    await this.labels.bulkAdd(data.labels)
    await this.cards.bulkAdd(data.cards)
  }
}

export const db = new DataBase()
