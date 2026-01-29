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
  uploadDebounce: DebouncedFunc<() => Promise<string | undefined>>
  private initPromise: Promise<boolean>
  private isUploading = false
  private autoUploadTimer: ReturnType<typeof setTimeout> | null = null

  // 从 localStorage 读取 modifiedTables
  get modifiedTables(): Set<TableName> {
    const stored = localStorage.getItem("modifiedTables")
    return new Set(stored ? JSON.parse(stored) : [])
  }

  // 写入 modifiedTables 到 localStorage
  set modifiedTables(value: Set<TableName>) {
    localStorage.setItem("modifiedTables", JSON.stringify([...value]))
  }

  constructor() {
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

  // 添加修改的表（支持单个或数组）
  addModifiedTable(tableNames: TableName | TableName[]) {
    const current = this.modifiedTables
    const names = Array.isArray(tableNames) ? tableNames : [tableNames]
    names.forEach((name) => current.add(name))
    this.modifiedTables = current
    localStorage.setItem("lastModifiedTime", Date.now() + "")
  }

  clearModifiedTables() {
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
  uploadImmediate = async (): Promise<string | undefined> => {
    if (this.isUploading) return
    this.isUploading = true
    try {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken) return
      if (this.modifiedTables.size === 0) return

      // 有 gistId 时才检查是否为空数据（防止覆盖远程数据）
      if (gistId) {
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
      }

      const data = await this.getModifiedData()
      if (!data || Object.keys(data).length === 0) return

      const newGistId = await GistManager.uploadData(data)
      const now = Date.now()
      await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
      this.clearModifiedTables()
      return newGistId
    } finally {
      this.isUploading = false
    }
  }

  // 供 dataManager 调用：标记修改的表并触发延迟上传
  triggerUpload = (tableName: TableName) => {
    this.addModifiedTable(tableName)
    // 清除 autoUpload 的定时器，由 uploadDebounce 接管
    if (this.autoUploadTimer) {
      clearTimeout(this.autoUploadTimer)
      this.autoUploadTimer = null
    }
    this.uploadDebounce()
  }

  // 手动上传全部数据（用于设置页面的"上传"按钮）
  uploadAll = async (): Promise<string | undefined> => {
    const allTables: TableName[] = [
      "spaces",
      "collections",
      "labels",
      "cards",
      "favicons",
    ]
    allTables.forEach((t) => this.addModifiedTable(t))
    return await this.uploadImmediate()
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
      if (!lastModifiedTime) return

      const elapsed = Date.now() - Number(lastModifiedTime)
      if (elapsed > this.SYNC_INTERVAL) {
        await this.uploadImmediate()
      } else {
        // 计算剩余时间，设置定时上传
        if (this.autoUploadTimer) {
          clearTimeout(this.autoUploadTimer)
        }
        const remaining = this.SYNC_INTERVAL - elapsed
        this.autoUploadTimer = setTimeout(
          () => this.uploadImmediate(),
          remaining,
        )
      }
    }
  }
}

export default SyncManager.getInstance()
