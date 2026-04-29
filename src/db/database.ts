import Dexie, { EntityTable } from "dexie"
import { Card, Collection, Favicon, Label, Space } from "@/type.ts"

class DataBase extends Dexie {
  private static instance: DataBase
  spaces!: EntityTable<Space, "id">
  collections!: EntityTable<Collection, "id">
  labels!: EntityTable<Label, "id">
  cards!: EntityTable<Card, "id">
  favicons!: EntityTable<Favicon, "id">

  constructor() {
    super("TabyDatabase")
    this.version(2).stores({
      spaces: "++id, title, order, createdAt, icon",
      collections:
        "++id, title, spaceId, order, labelIds, [spaceId+order], createdAt, icon",
      labels: "++id, title, color",
      cards:
        "++id, title, url, order, faviconId, description, collectionId, [collectionId+order], createdAt",
      favicons: "++id, url",
    })
  }

  public static getInstance(): DataBase {
    if (!DataBase.instance) {
      DataBase.instance = new DataBase()
      return DataBase.instance
    }
    if (!DataBase.instance.isOpen()) {
      // 旧实例已关闭（被显式 close、versionchange 或外部删库触发）。
      // 显式 close() 一次确保内部 listener / pending tx 被清掉，再重建。
      try {
        DataBase.instance.close()
      } catch {
        /* ignore */
      }
      DataBase.instance = new DataBase()
    }
    return DataBase.instance
  }
}

export const db = DataBase.getInstance()
