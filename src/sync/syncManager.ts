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
import {
  getDirtyToken as getDirtyTokenAsync,
  markDirtyAsync,
  clearDirty as clearDirtyAsync,
  clearDirtyIfUnchanged as clearDirtyIfUnchangedAsync,
  onDirtyChanged,
  DirtyToken,
} from "@/sync/dirtyStorage.ts"

const UPLOAD_LOCK_NAME = "taby-sync-upload"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  uploadDebounce: DebouncedFunc<() => Promise<string | undefined>>
  private initPromise: Promise<boolean>
  private autoUploadTimer: ReturnType<typeof setTimeout> | null = null

  // dirty token 内存缓存（持久化在 chrome.storage.local，由 SW/SPA 共享）。
  // 启动时通过 hydrateDirty() 同步，运行中通过 onDirtyChanged 监听跨 context 变更。
  private _dirtyToken: DirtyToken | null = null

  isDirty(): boolean {
    return this._dirtyToken !== null
  }

  // 给 UI 用的 dirty 时间戳（最近一次修改的近似时间），未 dirty 时返回 null
  getDirtyTimestamp(): number | null {
    return this._dirtyToken
  }

  // 标记本地有未上传的修改（异步落盘到 chrome.storage.local）
  async markDirty(): Promise<DirtyToken> {
    const next = await markDirtyAsync()
    this._dirtyToken = next
    return next
  }

  constructor() {
    this.uploadDebounce = debounce(
      () => this.uploadImmediate(),
      this.SYNC_INTERVAL,
      { leading: false, trailing: true },
    )

    // 设置数据修改回调
    dataManager.setOnModify(() => this.triggerUpload())

    // 监听 dirty 在其它 context（例如 SW 后台脚本）中的变化，
    // 收到变化后更新内存缓存并按需触发延迟上传。
    onDirtyChanged((newToken) => {
      this._dirtyToken = newToken
      if (newToken !== null) {
        if (this.autoUploadTimer) {
          clearTimeout(this.autoUploadTimer)
          this.autoUploadTimer = null
        }
        this.uploadDebounce()
      }
    })

    // 启动异步初始化
    this.initPromise = this.initialize()
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // 异步初始化：先同步 dirty 状态，再检查完整性，最后决定是否创建默认数据
  private async initialize(): Promise<boolean> {
    await this.hydrateDirty()
    const isRecovered = await this.checkDataIntegrity()
    if (!isRecovered) {
      await this.initializeDefaultData()
    }
    return isRecovered
  }

  private async hydrateDirty() {
    try {
      this._dirtyToken = await getDirtyTokenAsync()
    } catch (err) {
      console.warn("hydrateDirty failed:", err)
      this._dirtyToken = null
    }
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
    // 默认数据不算用户修改
    await clearDirtyAsync()
    this._dirtyToken = null
  }

  async checkDataIntegrity(): Promise<boolean> {
    try {
      const spaceCount = await db.spaces.count()
      // 仅当本地"真的空"且没有任何待上传修改时，才尝试从远端恢复
      if (spaceCount === 0 && !this.isDirty()) {
        const { accessToken, gistId } = await this.getToken()
        if (accessToken && gistId) {
          console.warn("检测到本地数据为空，尝试从远程恢复...")
          try {
            await this.triggerDownload()
            return true
          } catch (err) {
            console.warn("远程恢复失败，回退到默认初始化:", err)
          }
        }
      }
    } catch (error) {
      console.error("数据完整性检查失败:", error)
    }
    return false
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

  // 全量上传当前所有表数据。
  // - force=true 时即使没有 dirty 也会强制上传（设置页"上传"按钮）。
  // - 跨 Tab 互斥：用 navigator.locks 只允许同时一个 Tab 上传，其它 Tab 立即返回 undefined。
  uploadImmediate = async (
    force: boolean = false,
  ): Promise<string | undefined> => {
    // 跨 Tab 互斥；ifAvailable=true 表示锁被占时不排队，直接返回 null
    const runUpload = async (): Promise<string | undefined> => {
      const { accessToken } = await this.getToken()
      if (!accessToken) return

      const dirtyToken = this._dirtyToken
      if (!force && dirtyToken === null) return

      const data = await dataManager.getUploadData()
      const newGistId = await GistManager.uploadData(data)
      const now = Date.now()
      await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, String(now))
      // 仅当上传期间没有新的修改时才清除 dirty
      if (dirtyToken !== null) {
        await clearDirtyIfUnchangedAsync(dirtyToken)
        // 清除后立即同步内存缓存（onChanged 回调可能稍后才到）
        if (this._dirtyToken === dirtyToken) {
          this._dirtyToken = null
        }
      }
      return newGistId
    }

    if (typeof navigator !== "undefined" && navigator.locks) {
      return await navigator.locks.request(
        UPLOAD_LOCK_NAME,
        { mode: "exclusive", ifAvailable: true },
        async (lock) => {
          if (!lock) return undefined // 另一个 Tab 正在上传
          return await runUpload()
        },
      )
    }
    return await runUpload()
  }

  // 供 dataManager 调用：标记 dirty 并触发延迟上传
  triggerUpload = () => {
    void this.markDirty().catch((err) => {
      console.error("markDirty failed:", err)
    })
    if (this.autoUploadTimer) {
      clearTimeout(this.autoUploadTimer)
      this.autoUploadTimer = null
    }
    this.uploadDebounce()
  }

  // 手动上传全部数据（设置页面"上传"按钮）。失败抛错，避免调用方拿到 undefined
  // 误把假 gistId 写入存储破坏配置。
  uploadAll = async (): Promise<string> => {
    const result = await this.uploadImmediate(true)
    if (!result) {
      throw new Error(
        "Upload skipped: another upload is in progress or no access token configured.",
      )
    }
    return result
  }

  // allowEmpty: 用户在 UI 中显式确认覆盖时（同步对话框、版本回滚）才允许传 true。
  // 所有自动调用必须保持默认 false，避免远端损坏导致本地全清。
  triggerDownload = async (
    options: { allowEmpty?: boolean } = {},
  ): Promise<SyncData> => {
    const { allowEmpty = false } = options
    const data = await GistManager.downloadAll()

    const isRemoteEmpty = !data?.spaces || data.spaces.length === 0
    if (isRemoteEmpty && !allowEmpty) {
      throw new Error(
        "Remote data is empty or invalid; aborting download to protect local data.",
      )
    }

    await dataManager.importData(data)
    // 下载覆盖后本地不再有未上传的修改
    await clearDirtyAsync()
    this._dirtyToken = null
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, String(Date.now()))
    return data
  }

  autoDownload = async (): Promise<boolean> => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return false

    // 关键安全步骤：本地有未上传修改时，先尝试 flush，避免被远端覆盖。
    // flush 失败则放弃本次 autoDownload，宁可等到下次上传，也不丢本地数据。
    if (this.isDirty()) {
      try {
        await this.uploadImmediate(true)
      } catch (err) {
        console.warn(
          "Pre-download flush failed; skipping autoDownload to protect local data:",
          err,
        )
        return false
      }
      // flush 成功后远端就是本地副本，无需再下载
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

    const dirtyToken = this._dirtyToken
    if (dirtyToken === null) return

    const elapsed = Date.now() - dirtyToken
    if (elapsed > this.SYNC_INTERVAL) {
      await this.uploadImmediate()
    } else {
      if (this.autoUploadTimer) {
        clearTimeout(this.autoUploadTimer)
      }
      const remaining = this.SYNC_INTERVAL - elapsed
      this.autoUploadTimer = setTimeout(() => this.uploadImmediate(), remaining)
    }
  }
}

export default SyncManager.getInstance()
