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

const DIRTY_KEY = "lastModifiedTime"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  uploadDebounce: DebouncedFunc<() => Promise<string | undefined>>
  private initPromise: Promise<boolean>
  private isUploading = false
  private autoUploadTimer: ReturnType<typeof setTimeout> | null = null

  // 是否有未上传的修改。dirty 标记复用 lastModifiedTime：
  // - markDirty() 会写入一个单调递增的值（毫秒级时间戳；同毫秒内会 +1 保证递增）
  // - uploadImmediate 在上传前快照该值，上传成功后只在值未变时才清除，
  //   这样可以避免“上传期间的新修改”被误清造成 lost-update
  isDirty(): boolean {
    return localStorage.getItem(DIRTY_KEY) !== null
  }

  // 获取当前 dirty token；不存在时返回 null
  private getDirtyToken(): string | null {
    return localStorage.getItem(DIRTY_KEY)
  }

  // 标记本地有未上传的修改
  markDirty() {
    const cur = Number(localStorage.getItem(DIRTY_KEY) ?? 0)
    const next = Math.max(cur + 1, Date.now())
    localStorage.setItem(DIRTY_KEY, String(next))
  }

  // 上传成功后调用：仅当 dirty token 没被新修改改动时清除
  private clearDirtyIfUnchanged(token: string | null) {
    if (token === null) return
    if (localStorage.getItem(DIRTY_KEY) === token) {
      localStorage.removeItem(DIRTY_KEY)
    }
  }

  constructor() {
    this.uploadDebounce = debounce(
      () => this.uploadImmediate(),
      this.SYNC_INTERVAL,
      { leading: false, trailing: true },
    )

    // 设置数据修改回调
    dataManager.setOnModify(() => this.triggerUpload())

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
    // 默认数据不算用户修改，清掉 dirty 标记避免误上传
    localStorage.removeItem(DIRTY_KEY)
  }

  async checkDataIntegrity(): Promise<boolean> {
    try {
      const spaceCount = await db.spaces.count()

      // 仅当本地“真的空”（spaces=0）且没有任何待上传的本地修改时，
      // 才尝试从远端恢复。1 space + 0 collections 是合法状态（用户刚建/清空）。
      if (spaceCount === 0 && !this.isDirty()) {
        const { accessToken, gistId } = await this.getToken()

        if (accessToken && gistId) {
          console.warn("检测到本地数据为空，尝试从远程恢复...")
          try {
            await this.triggerDownload()
            return true
          } catch (err) {
            // 远端也是空 / 无效 → 不视为恢复成功，让上层走 initializeDefaultData
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
  // force=true 时即使没有 dirty 标记也会强制上传（用于设置页“上传”按钮）。
  uploadImmediate = async (
    force: boolean = false,
  ): Promise<string | undefined> => {
    if (this.isUploading) return
    this.isUploading = true
    try {
      const { accessToken } = await this.getToken()
      if (!accessToken) return

      const dirtyToken = this.getDirtyToken()
      if (!force && dirtyToken === null) return

      const data = await dataManager.getUploadData()
      const newGistId = await GistManager.uploadData(data)
      const now = Date.now()
      await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, String(now))
      // 仅当上传期间没有新的修改时才清除 dirty 标记
      this.clearDirtyIfUnchanged(dirtyToken)
      return newGistId
    } finally {
      this.isUploading = false
    }
  }

  // 供 dataManager 调用：标记 dirty 并触发延迟上传
  triggerUpload = () => {
    this.markDirty()
    // 清除 autoUpload 的定时器，由 uploadDebounce 接管
    if (this.autoUploadTimer) {
      clearTimeout(this.autoUploadTimer)
      this.autoUploadTimer = null
    }
    this.uploadDebounce()
  }

  // 手动上传全部数据（用于设置页面的"上传"按钮），强制上传。
  uploadAll = async (): Promise<string | undefined> => {
    return await this.uploadImmediate(true)
  }

  // allowEmpty: 用户在 UI 中显式确认覆盖时（例如同步对话框、版本回滚）才允许传 true，
  // 用 empty 远端数据覆盖本地。所有自动调用必须保持默认 false，避免远端损坏导致本地全清。
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
    localStorage.removeItem(DIRTY_KEY)
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, String(Date.now()))
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

    const dirtyToken = this.getDirtyToken()
    if (dirtyToken === null) return

    const elapsed = Date.now() - Number(dirtyToken)
    if (elapsed > this.SYNC_INTERVAL) {
      await this.uploadImmediate()
    } else {
      // 计算剩余时间，设置定时上传
      if (this.autoUploadTimer) {
        clearTimeout(this.autoUploadTimer)
      }
      const remaining = this.SYNC_INTERVAL - elapsed
      this.autoUploadTimer = setTimeout(() => this.uploadImmediate(), remaining)
    }
  }
}

export default SyncManager.getInstance()
