import { SyncData } from "@/type.ts"
import {
  SYNC_LAST_ETAG,
  SYNC_LAST_REMOTE_UPDATED_AT,
  SYNC_WEBDAV_PASSWORD,
  SYNC_WEBDAV_USERNAME,
} from "@/utils/constants.ts"
import {
  buildWebdavLocation,
  buildWebdavUrl,
  getWebdavConfig,
} from "@/sync/webdavConfig.ts"
import { AuthType, createClient } from "webdav"
import type { FileStat, ResponseDataDetailed, WebDAVClient } from "webdav"

interface WebdavPayload {
  version: 1
  updatedAt: string
  data: SyncData
}

class WebdavManager {
  private static instance: WebdavManager

  public static getInstance(): WebdavManager {
    if (!WebdavManager.instance) {
      WebdavManager.instance = new WebdavManager()
    }
    return WebdavManager.instance
  }

  private get URL() {
    return buildWebdavUrl(getWebdavConfig())
  }

  private get USERNAME() {
    return localStorage.getItem(SYNC_WEBDAV_USERNAME) || ""
  }

  private get PASSWORD() {
    return localStorage.getItem(SYNC_WEBDAV_PASSWORD) || ""
  }

  private getStateKey(key: string) {
    return `${key}:webdav:${encodeURIComponent(this.URL)}:${encodeURIComponent(
      this.USERNAME,
    )}`
  }

  private get connection() {
    const location = buildWebdavLocation(getWebdavConfig())
    if (!location) {
      throw new Error("未设置 WebDAV Host")
    }
    const hasCredentials = !!(this.USERNAME || this.PASSWORD)
    return {
      client: createClient(location.baseUrl, {
        authType: hasCredentials ? AuthType.Auto : AuthType.None,
        username: this.USERNAME,
        password: this.PASSWORD,
      }),
      directoryPath: location.directoryPath,
      filePath: location.filePath,
    }
  }

  getLastRemoteUpdatedAt(): string {
    return (
      localStorage.getItem(this.getStateKey(SYNC_LAST_REMOTE_UPDATED_AT)) || ""
    )
  }

  getLastEtag(): string {
    return localStorage.getItem(this.getStateKey(SYNC_LAST_ETAG)) || ""
  }

  clearSyncedRemoteState() {
    localStorage.removeItem(this.getStateKey(SYNC_LAST_REMOTE_UPDATED_AT))
    localStorage.removeItem(this.getStateKey(SYNC_LAST_ETAG))
  }

  commitSyncedRemoteState(updatedAt?: string, etag?: string) {
    this.saveSyncedRemoteState(updatedAt, etag)
  }

  private saveSyncedRemoteState(updatedAt?: string, etag?: string) {
    if (updatedAt) {
      localStorage.setItem(
        this.getStateKey(SYNC_LAST_REMOTE_UPDATED_AT),
        updatedAt,
      )
    }
    if (etag) {
      localStorage.setItem(this.getStateKey(SYNC_LAST_ETAG), etag)
    }
  }

  private parsePayload(payload: unknown): {
    updatedAt?: string
    data: SyncData
  } {
    const maybePayload = payload as Partial<WebdavPayload>
    if (maybePayload.data) {
      return {
        updatedAt: maybePayload.updatedAt,
        data: this.normalizeData(maybePayload.data),
      }
    }
    return {
      data: this.normalizeData(payload),
    }
  }

  private normalizeData(data: unknown): SyncData {
    const maybeData = data as Partial<SyncData>
    return {
      spaces: Array.isArray(maybeData.spaces) ? maybeData.spaces : [],
      collections: Array.isArray(maybeData.collections)
        ? maybeData.collections
        : [],
      labels: Array.isArray(maybeData.labels) ? maybeData.labels : [],
      cards: Array.isArray(maybeData.cards) ? maybeData.cards : [],
      favicons: Array.isArray(maybeData.favicons) ? maybeData.favicons : [],
    }
  }

  private normalizeDate(value: string | null) {
    if (!value) return undefined
    const timestamp = Date.parse(value)
    return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString()
  }

  private isNotNewer(remoteUpdatedAt: string, lastSeen: string) {
    const remoteTime = Date.parse(remoteUpdatedAt)
    const lastSeenTime = Date.parse(lastSeen)
    if (!Number.isNaN(remoteTime) && !Number.isNaN(lastSeenTime)) {
      return remoteTime <= lastSeenTime
    }
    return remoteUpdatedAt <= lastSeen
  }

  private isNotFoundError(error: unknown) {
    if (typeof error !== "object" || error === null || !("status" in error)) {
      return false
    }
    const status = Number((error as { status?: unknown }).status)
    return status === 404
  }

  private async statFile(client: WebDAVClient, filePath: string) {
    const stat = await client.stat(filePath)
    return "data" in stat
      ? (stat as ResponseDataDetailed<FileStat>).data
      : (stat as FileStat)
  }

  async uploadData(data: Partial<SyncData>) {
    const { client, directoryPath, filePath } = this.connection
    if (directoryPath) {
      await client.createDirectory(directoryPath, { recursive: true })
    }
    const updatedAt = new Date().toISOString()
    const payload: WebdavPayload = {
      version: 1,
      updatedAt,
      data: this.normalizeData(data),
    }
    await client.putFileContents(filePath, JSON.stringify(payload), {
      overwrite: true,
      headers: {
        "Content-Type": "application/json",
      },
    })
    try {
      const stat = await this.statFile(client, filePath)
      this.saveSyncedRemoteState(
        this.normalizeDate(stat.lastmod) || updatedAt,
        typeof stat.etag === "string" ? stat.etag : undefined,
      )
    } catch {
      this.saveSyncedRemoteState(updatedAt)
    }
    return this.URL
  }

  async downloadAll() {
    const meta = await this.fetchRemoteMeta({ forceRead: true })
    if (!meta.data) {
      throw new Error("WebDAV remote data is empty")
    }
    this.saveSyncedRemoteState(meta.updatedAt, meta.etag)
    return meta.data
  }

  async fetchRemoteMeta(options: { forceRead?: boolean } = {}): Promise<{
    notModified: boolean
    updatedAt?: string
    etag?: string
    data?: SyncData
  }> {
    const { client, filePath } = this.connection
    const lastEtag = this.getLastEtag()
    const lastSeen = this.getLastRemoteUpdatedAt()
    let remoteEtag: string | undefined
    let remoteUpdatedAt: string | undefined
    try {
      const stat = await this.statFile(client, filePath)
      remoteEtag = typeof stat.etag === "string" ? stat.etag : undefined
      remoteUpdatedAt = this.normalizeDate(stat.lastmod)
      if (
        !options.forceRead &&
        lastEtag &&
        remoteEtag &&
        lastEtag === remoteEtag
      ) {
        return { notModified: true }
      }
      if (
        !options.forceRead &&
        !remoteEtag &&
        remoteUpdatedAt &&
        lastSeen &&
        this.isNotNewer(remoteUpdatedAt, lastSeen)
      ) {
        return { notModified: true }
      }
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return { notModified: false }
      }
      throw error
    }

    const content = await client.getFileContents(filePath, { format: "text" })
    const payload = this.parsePayload(JSON.parse(String(content)))
    return {
      notModified: false,
      updatedAt: remoteUpdatedAt || payload.updatedAt,
      etag: remoteEtag,
      data: payload.data,
    }
  }
}

export default WebdavManager.getInstance()
