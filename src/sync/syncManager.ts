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

export type ConflictResolution = "local" | "remote" | "cancel"

export interface ConflictInfo {
  localDirtyAt: number | null
  remoteUpdatedAt: string
  remoteData: SyncData
}

export type ConflictHandler = (
  info: ConflictInfo,
) => Promise<ConflictResolution>

export class SyncConflictCancelledError extends Error {
  constructor() {
    super("Upload cancelled by user due to remote conflict.")
    this.name = "SyncConflictCancelledError"
  }
}

export class SyncConflictResolvedRemoteError extends Error {
  constructor() {
    super("Upload skipped: user chose to use remote data on conflict.")
    this.name = "SyncConflictResolvedRemoteError"
  }
}

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  uploadDebounce: DebouncedFunc<() => Promise<string | undefined>>
  private initPromise: Promise<boolean>
  private autoUploadTimer: ReturnType<typeof setTimeout> | null = null

  // dirty token 内存缓存（持久化在 chrome.storage.local，由 SW/SPA 共享）。
  // 启动时通过 hydrateDirty() 同步，运行中通过 onDirtyChanged 监听跨 context 变更。
  private _dirtyToken: DirtyToken | null = null

  // 冲突处理钩子，由 UI 层注入（弹窗让用户选择 local / remote / cancel）。
  // 没有注入时退化为：仍然检测冲突，但默认按 "local"（保留原有行为，只是日志告警）。
  private conflictHandler?: ConflictHandler

  setConflictHandler(handler: ConflictHandler | undefined) {
    this.conflictHandler = handler
  }

  // 远端数据被覆盖到本地后调用（例如冲突时用户选了 remote、或 autoDownload 触发后），
  // 由 UI 层注入用于刷新 store / 上下文菜单等。
  private onRemoteImported?: () => void | Promise<void>

  setOnRemoteImported(cb: (() => void | Promise<void>) | undefined) {
    this.onRemoteImported = cb
  }

  async resetSyncTargetState(): Promise<void> {
    GistManager.clearSyncedRemoteState()
    localStorage.removeItem(LOCAL_LAST_DOWNLOAD_TIME)
    await chrome.storage.sync.remove(REMOTE_LAST_UPDATE_TIME)
  }

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

  // 包装 uploadImmediate：把已知的"用户取消 / 选择 remote"等期望异常吞掉，
  // 仅记录真正的错误，避免 unhandled rejection 噪声。供 debounce / setTimeout 等无 try/catch 的调用处使用。
  private safeUpload = async (
    force: boolean = false,
  ): Promise<string | undefined> => {
    try {
      return await this.uploadImmediate(force)
    } catch (err) {
      if (
        err instanceof SyncConflictCancelledError ||
        err instanceof SyncConflictResolvedRemoteError
      ) {
        console.log("[sync] upload skipped:", err.message)
        return undefined
      }
      console.error("[sync] upload failed:", err)
      return undefined
    }
  }

  constructor() {
    this.uploadDebounce = debounce(
      () => this.safeUpload(),
      this.SYNC_INTERVAL,
      {
        leading: false,
        trailing: true,
        // 用户连续操作时不会无限延迟上传：最多 30 分钟必然触发一次。
        // 同时保证 maxWait ≥ wait（lodash 限制）。
        maxWait: Math.max(this.SYNC_INTERVAL, 30 * 60 * 1000),
      },
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
    const nextInterval = value * 60 * 1000
    if (nextInterval === this.SYNC_INTERVAL) return

    this.SYNC_INTERVAL = nextInterval
    if (this.uploadDebounce) {
      if (typeof this.uploadDebounce.cancel === "function") {
        this.uploadDebounce.cancel()
      }
    }
    if (this.autoUploadTimer) {
      clearTimeout(this.autoUploadTimer)
      this.autoUploadTimer = null
    }
    this.uploadDebounce = debounce(
      () => this.safeUpload(),
      this.SYNC_INTERVAL,
      {
        leading: false,
        trailing: true,
        maxWait: Math.max(this.SYNC_INTERVAL, 30 * 60 * 1000),
      },
    )
    this.scheduleDirtyUpload()
  }

  private scheduleDirtyUpload() {
    const dirtyToken = this._dirtyToken
    if (dirtyToken === null) return

    const elapsed = Date.now() - dirtyToken
    if (elapsed >= this.SYNC_INTERVAL) {
      void this.safeUpload()
      return
    }

    this.autoUploadTimer = setTimeout(
      () => this.safeUpload(),
      this.SYNC_INTERVAL - elapsed,
    )
  }

  // 全量上传当前所有表数据。
  // - force=true 时即使没有 dirty 也会强制上传（设置页"上传"按钮）。
  // - 跨 Tab 互斥：用 navigator.locks 只允许同时一个 Tab 上传，其它 Tab 立即返回 undefined。
  // - 冲突检测：上传前 GET 一次 Gist（带 If-None-Match），如果远端被其它设备改过且
  //   updated_at 比本地记录的 lastSeen 新，调用 conflictHandler 让用户决定
  //   local（覆盖远端）/ remote（接受远端）/ cancel（保留 dirty）。
  //   no handler 时默认 local（保持向后兼容，只是 console.warn）。
  uploadImmediate = async (
    force: boolean = false,
  ): Promise<string | undefined> => {
    const runUpload = async (): Promise<string | undefined> => {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken) return

      const dirtyToken = this._dirtyToken
      if (!force && dirtyToken === null) return

      // 冲突检测：仅当已经有 Gist 存在时检查（首次 createGist 不需要）
      if (gistId) {
        const decided = await this.detectAndResolveConflict()
        if (decided === "remote") throw new SyncConflictResolvedRemoteError()
        if (decided === "cancel") throw new SyncConflictCancelledError()
        // "local" 或 "no-conflict" → 继续 PATCH 覆盖
      }

      const data = await dataManager.getUploadData()
      const newGistId = await GistManager.uploadData(data)
      const now = Date.now()
      await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, String(now))
      if (dirtyToken !== null) {
        await clearDirtyIfUnchangedAsync(dirtyToken)
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

  // 返回 "local" / "remote" / "cancel" / "no-conflict"。
  // - no-conflict / local：调用方继续 PATCH。
  // - remote：调用方应停止上传（已经把远端 import 进来）。
  // - cancel：调用方应停止上传，保留 dirty。
  private async detectAndResolveConflict(): Promise<
    "no-conflict" | ConflictResolution
  > {
    let meta: Awaited<ReturnType<typeof GistManager.fetchGistMeta>>
    try {
      meta = await GistManager.fetchGistMeta()
    } catch (err) {
      // 网络问题等：放过，后续 PATCH 失败也是相同的失败模式
      console.warn("Conflict pre-check fetch failed, skipping:", err)
      return "no-conflict"
    }
    if (meta.notModified) return "no-conflict"

    const lastSeen = GistManager.getLastRemoteUpdatedAt()
    const remoteUpdatedAt = meta.updatedAt ?? ""

    // lastSeen 缺失通常意味着首次上传 / 元数据被清。保守处理：当远端有数据时也按冲突走，
    // 避免“配了一个共用的 gistId 但本地从没拉过远端”的场景被覆盖。
    const isConflict = lastSeen
      ? !!remoteUpdatedAt && remoteUpdatedAt > lastSeen
      : !!remoteUpdatedAt && !!meta.data?.spaces?.length

    if (!isConflict) return "no-conflict"

    if (!this.conflictHandler) {
      console.warn(
        "Sync conflict detected but no conflict handler registered; defaulting to local-overwrite. " +
          "Remote updated_at:",
        remoteUpdatedAt,
        "lastSeen:",
        lastSeen,
      )
      return "local"
    }

    let decision: ConflictResolution
    try {
      decision = await this.conflictHandler({
        localDirtyAt: this._dirtyToken,
        remoteUpdatedAt,
        remoteData: meta.data!,
      })
    } catch (err) {
      console.warn("conflictHandler threw, treating as cancel:", err)
      return "cancel"
    }

    if (decision === "remote") {
      // 接受远端：用 fetchGistMeta 已经拿到的数据 import，避免再多一次 GET
      await dataManager.importData(meta.data!)
      await clearDirtyAsync()
      this._dirtyToken = null
      GistManager.commitSyncedRemoteState(meta.updatedAt, meta.etag)
      localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, String(Date.now()))
      // 通知 UI 刷新（store + 上下文菜单等）
      try {
        await this.onRemoteImported?.()
      } catch (err) {
        console.warn("onRemoteImported callback failed:", err)
      }
    }
    // local / cancel 不在这里改任何持久化状态，由调用方处理后续 PATCH 或保留 dirty
    return decision
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
    try {
      await this.onRemoteImported?.()
    } catch (err) {
      console.warn("onRemoteImported callback failed:", err)
    }
    return data
  }

  autoDownload = async (): Promise<boolean> => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return false

    try {
      // 先用 chrome.storage.sync 上的 REMOTE_LAST_UPDATE_TIME 做廉价检查，
      // 没必要每次 visibilitychange 都打 GitHub API。
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

      const shouldDownload =
        !localDownloadTime ||
        (!!remoteUpdateTime && Number(remoteUpdateTime) > localDownloadTime)

      if (!shouldDownload) {
        return false
      }

      // 远端比本地新。如果本地还有未上传的修改，先 flush 保护本地数据，
      // 把 last-write-wins 的责任交给冲突检测路径。
      if (this.isDirty()) {
        try {
          await this.safeUpload(true)
        } catch (err) {
          console.warn("Pre-download flush failed; aborting autoDownload:", err)
          return false
        }
        // flush 后本地状态 ≈ 远端，没必要再下载
        return false
      }

      console.log("Remote Gist potentially newer, downloading...")
      await this.triggerDownload()
      return true
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
      await this.safeUpload()
    } else {
      if (this.autoUploadTimer) {
        clearTimeout(this.autoUploadTimer)
      }
      const remaining = this.SYNC_INTERVAL - elapsed
      this.autoUploadTimer = setTimeout(() => this.safeUpload(), remaining)
    }
  }
}

export default SyncManager.getInstance()
