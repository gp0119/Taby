import { db } from "@/db/database.ts"
import dataManager from "@/db/index.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData, SyncTokenData } from "@/type.ts"
import { debounce, isEmpty, DebouncedFunc } from "lodash-es"
import {
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
  LOCAL_LAST_DOWNLOAD_TIME,
  REMOTE_LAST_UPDATE_TIME,
} from "@/utils/constants.ts"
import { EntityTable } from "dexie"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  modifiedTables: Set<string> = new Set()
  uploadModifiedTablesDebounce: DebouncedFunc<() => Promise<void>>
  private initPromise: Promise<boolean>
  private isUploading = false

  constructor() {
    this.modifiedTables = new Set(
      JSON.parse(localStorage.getItem("modifiedTables") || "[]") || [],
    )
    this.uploadModifiedTablesDebounce = debounce(
      () => this.uploadModifiedTablesImmediate(),
      this.SYNC_INTERVAL,
      { leading: false, trailing: true },
    )

    this.addHooks()

    // 启动异步初始化
    this.initPromise = this.initialize()
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // 异步初始化：先检查完整性，再决定是否创建默认数据
  private async initialize(): Promise<boolean> {
    const isRecovered = await this.checkDataIntegrity()

    if (!isRecovered) {
      await this.initializeDefaultData()
    }

    return isRecovered
  }

  // 等待初始化完成（供外部调用）
  async waitForInit(): Promise<boolean> {
    return await this.initPromise
  }

  private async createDefaultSpace() {
    await db.spaces.add({
      title: "My Collections",
      order: 1000,
      createdAt: Date.now(),
      icon: "StorefrontOutline",
    })
  }

  private async initializeDefaultData() {
    const spaceCount = await db.spaces.count()
    if (spaceCount > 0) return
    await this.createDefaultSpace()
    this.clearModifiedTable()
  }

  async checkDataIntegrity(): Promise<boolean> {
    try {
      const [spaceCount, collectionCount, cardCount] = await Promise.all([
        db.spaces.count(),
        db.collections.count(),
        db.cards.count(),
      ])

      const isEmptyOrDefault =
        spaceCount === 0 ||
        (spaceCount === 1 && collectionCount === 0 && cardCount === 0)

      if (isEmptyOrDefault) {
        const { accessToken, gistId } = await this.getToken()

        if (accessToken && gistId) {
          console.warn("检测到数据丢失，从远程恢复...")
          this.clearModifiedTable()
          await this.triggerDownload()
          return true
        }
      }
    } catch (error) {
      console.error("数据完整性检查失败:", error)
    }
    return false
  }

  addModifiedTable(tableName: string) {
    this.modifiedTables.add(tableName)
    localStorage.setItem(
      "modifiedTables",
      JSON.stringify([...this.modifiedTables]),
    )
  }

  clearModifiedTable() {
    this.modifiedTables.clear()
    localStorage.removeItem("modifiedTables")
    localStorage.removeItem("lastModifiedTime")
  }

  addHooks() {
    const tableMapping = [
      { table: db.spaces, name: "spaces" },
      { table: db.collections, name: "collections" },
      { table: db.labels, name: "labels" },
      { table: db.cards, name: "cards" },
      { table: db.favicons, name: "favicons" },
    ]
    const self = this
    tableMapping.forEach(({ table, name }) => {
      table.hook("creating", function () {
        // console.log("creating", name)
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
    for (const tableName of modifiedTables) {
      const table = db[tableName as keyof typeof db]
      modifiedData[tableName as keyof SyncData] = await (
        table as EntityTable<any, any>
      ).toArray()
    }
    return modifiedData
  }

  getToken = async (): Promise<SyncTokenData> => {
    const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
    const gistId = localStorage.getItem(SYNC_GIST_ID)
    return {
      accessToken: accessToken || "",
      gistId: gistId || "",
    }
  }

  setEnv(key: string, value: string) {
    GistManager.setEnv(key, value)
  }

  setInterval(value: number) {
    this.SYNC_INTERVAL = value * 60 * 1000
    if (
      this.uploadModifiedTablesDebounce &&
      typeof this.uploadModifiedTablesDebounce.cancel === "function"
    ) {
      this.uploadModifiedTablesDebounce.cancel()
    }
    this.uploadModifiedTablesDebounce = debounce(
      () => this.uploadModifiedTablesImmediate(),
      this.SYNC_INTERVAL,
      { leading: false, trailing: true },
    )
  }

  uploadAll = async () => {
    const data: Partial<SyncData> = await dataManager.getUploadData()
    if (!data) return
    const result = await GistManager.uploadData(data)
    const now = Date.now()
    await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
    await this.clearModifiedTable()
    return result
  }

  uploadModifiedTablesImmediate = async () => {
    if (this.isUploading) return
    this.isUploading = true
    try {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken || !gistId) return
      const modifiedData: Partial<SyncData> = await this.getModifiedTables()
      if (isEmpty(modifiedData)) return

      // 检查是否只是默认的空数据
      const spacesData = modifiedData.spaces || []
      const collectionsData = modifiedData.collections || []
      const cardsData = modifiedData.cards || []

      // 如果只有1个 space 且没有 collection 或 card，可能是默认数据
      if (
        spacesData.length <= 1 &&
        collectionsData.length === 0 &&
        cardsData.length === 0
      ) {
        console.warn("检测到疑似默认空数据，不上传。尝试从远程下载...")
        await this.triggerDownload()
        return
      }

      await GistManager.uploadData(modifiedData)
      const now = Date.now()
      await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
      this.clearModifiedTable()
    } finally {
      this.isUploading = false
    }
  }

  triggerUpload = async () => {
    localStorage.setItem("lastModifiedTime", Date.now() + "")
    await this.uploadModifiedTablesDebounce()
  }

  triggerDownload = async () => {
    const data = await GistManager.downloadAll()
    await dataManager.importData(data)
    await this.clearModifiedTable()
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, Date.now() + "")
    return data
  }

  autoDownload = async (): Promise<boolean> => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) {
      return false
    }
    try {
      const syncStorage = await chrome.storage.sync.get([
        REMOTE_LAST_UPDATE_TIME,
      ])
      const remoteUpdateTime = syncStorage[REMOTE_LAST_UPDATE_TIME]
      const localDownloadTimeStr = localStorage.getItem(
        LOCAL_LAST_DOWNLOAD_TIME,
      )
      const localDownloadTime = localDownloadTimeStr
        ? Number(localDownloadTimeStr)
        : 0

      if (
        !localDownloadTime ||
        (remoteUpdateTime && Number(remoteUpdateTime) > localDownloadTime)
      ) {
        console.log("Remote Gist potentially newer, downloading...")
        await this.triggerDownload()
        return true
      } else {
        console.log("Local data is up-to-date, skipping download.")
        return false
      }
    } catch (error) {
      console.error("Error during autoDownload check:", error)
      return false
    }
  }

  autoUpload = async () => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return
    const modifiedTables = localStorage.getItem("modifiedTables")
    if (modifiedTables) {
      const lastModifiedTime = localStorage.getItem("lastModifiedTime")
      const tables = JSON.parse(modifiedTables)
      if (
        tables.length > 0 &&
        Date.now() - Number(lastModifiedTime) > this.SYNC_INTERVAL
      ) {
        await this.uploadModifiedTablesImmediate()
      }
    } else {
      localStorage.removeItem("lastModifiedTime")
    }
  }
}

export default SyncManager.getInstance()
