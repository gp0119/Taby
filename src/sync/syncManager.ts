import { db } from "@/db/database.ts"
import dataManager from "@/db/index.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData, SyncTokenData } from "@/type.ts"
import { debounce, DebouncedFunc } from "lodash-es"
import {
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
  LOCAL_LAST_DOWNLOAD_TIME,
  REMOTE_LAST_UPDATE_TIME,
} from "@/utils/constants.ts"
import { EntityTable } from "dexie"

type TableName = "spaces" | "collections" | "labels" | "cards" | "favicons"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  modifiedTables: Set<TableName> = new Set()
  private uploadDebounce: DebouncedFunc<() => Promise<void>>
  private initPromise: Promise<boolean>
  private isUploading = false

  constructor() {
    this.modifiedTables = new Set(
      JSON.parse(localStorage.getItem("modifiedTables") || "[]") || [],
    )
    this.uploadDebounce = debounce(
      () => this.uploadImmediate(),
      this.SYNC_INTERVAL,
      { leading: false, trailing: true },
    )

    // 设置数据修改回调
    dataManager.setOnModify((table: TableName) => this.triggerUpload(table))

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
    this.clearModifiedTables()
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
          this.clearModifiedTables()
          await this.triggerDownload()
          return true
        }
      }
    } catch (error) {
      console.error("数据完整性检查失败:", error)
    }
    return false
  }

  // 添加修改的表
  addModifiedTable(tableName: TableName) {
    this.modifiedTables.add(tableName)
    localStorage.setItem(
      "modifiedTables",
      JSON.stringify([...this.modifiedTables]),
    )
    localStorage.setItem("lastModifiedTime", Date.now() + "")
  }

  clearModifiedTables() {
    this.modifiedTables.clear()
    localStorage.removeItem("modifiedTables")
    localStorage.removeItem("lastModifiedTime")
  }

  // 获取修改的表数据
  private async getModifiedData(): Promise<Partial<SyncData>> {
    const modifiedData: Partial<SyncData> = {}
    for (const tableName of this.modifiedTables) {
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
      this.uploadDebounce &&
      typeof this.uploadDebounce.cancel === "function"
    ) {
      this.uploadDebounce.cancel()
    }
    this.uploadDebounce = debounce(
      () => this.uploadImmediate(),
      this.SYNC_INTERVAL,
      { leading: false, trailing: true },
    )
  }

  // 立即上传修改的数据
  uploadImmediate = async () => {
    if (this.isUploading) return
    this.isUploading = true
    try {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken || !gistId) return
      if (this.modifiedTables.size === 0) return

      // 检查整个数据库是否只是默认的空数据
      const [spaceCount, collectionCount, cardCount] = await Promise.all([
        db.spaces.count(),
        db.collections.count(),
        db.cards.count(),
      ])

      if (spaceCount <= 1 && collectionCount === 0 && cardCount === 0) {
        console.warn("检测到疑似默认空数据，不上传。尝试从远程下载...")
        await this.triggerDownload()
        return
      }

      const data = await this.getModifiedData()
      if (!data || Object.keys(data).length === 0) return

      await GistManager.uploadData(data)
      const now = Date.now()
      await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
      this.clearModifiedTables()
    } finally {
      this.isUploading = false
    }
  }

  // 供 dataManager 调用：标记修改的表并触发延迟上传
  triggerUpload = (tableName: TableName) => {
    this.addModifiedTable(tableName)
    this.uploadDebounce()
  }

  // 手动上传全部数据（用于设置页面的"上传"按钮）
  uploadAll = async () => {
    const allTables: TableName[] = [
      "spaces",
      "collections",
      "labels",
      "cards",
      "favicons",
    ]
    allTables.forEach((t) => this.addModifiedTable(t))
    await this.uploadImmediate()
  }

  triggerDownload = async () => {
    const data = await GistManager.downloadAll()
    await dataManager.importData(data)
    this.clearModifiedTables()
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

    if (this.modifiedTables.size > 0) {
      const lastModifiedTime = localStorage.getItem("lastModifiedTime")
      if (
        lastModifiedTime &&
        Date.now() - Number(lastModifiedTime) > this.SYNC_INTERVAL
      ) {
        await this.uploadImmediate()
      }
    }
  }
}

export default SyncManager.getInstance()
