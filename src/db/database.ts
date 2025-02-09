import Dexie, { EntityTable } from "dexie"

import { Card, Collection, Label, Space } from "@/type.ts"

class DataBase extends Dexie {
  spaces!: EntityTable<Space, "id">
  collections!: EntityTable<Collection, "id">
  labels!: EntityTable<Label, "id">
  cards!: EntityTable<Card, "id">

  constructor() {
    super("TabbyDatabase")
    this.version(1).stores({
      spaces: "++id, title, order, createdAt, modifiedAt",
      collections:
        "++id, title, spaceId, order, labelIds, [spaceId+order], createdAt, modifiedAt",
      labels: "++id, title, color, createdAt, modifiedAt",
      cards:
        "++id, title, url, customTitle, order, customDescription, collectionId, [collectionId+order], createdAt, modifiedAt",
    })
    console.log("init")
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
        const now = Date.now()
        obj.createdAt = now
        obj.modifiedAt = now
      })
      table.hook("updating", function (modifications, _primKey, _obj) {
        if (typeof modifications === "object") {
          // @ts-ignore
          modifications.modifiedAt = Date.now()
        }
        return modifications
      })
    })
  }
}

export const db = new DataBase()
