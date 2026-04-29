import { SyncData } from "@/type.ts"
import {
  GITHUB_API,
  GITEE_API,
  SYNC_TYPE,
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
  SYNC_LAST_REMOTE_UPDATED_AT,
  SYNC_LAST_ETAG,
} from "@/utils/constants.ts"
import { compressToUTF16, decompressFromUTF16 } from "lz-string"

interface GistRawResponse {
  id?: string
  description?: string
  updated_at?: string
  files: {
    spaces?: { content: string }
    collections?: { content: string }
    labels?: { content: string }
    cards?: { content: string }
    favicons?: { content: string }
  }
}

class GistManager {
  private static instance: GistManager

  private get API() {
    const syncType = localStorage.getItem(SYNC_TYPE)
    return syncType === "gitee" ? GITEE_API : GITHUB_API
  }

  private get ACCESS_TOKEN() {
    return localStorage.getItem(SYNC_GIST_TOKEN) || ""
  }

  private get GIST_ID() {
    return localStorage.getItem(SYNC_GIST_ID) || ""
  }

  private set GIST_ID(value: string) {
    localStorage.setItem(SYNC_GIST_ID, value)
  }

  public static getInstance(): GistManager {
    if (!GistManager.instance) {
      GistManager.instance = new GistManager()
    }
    return GistManager.instance
  }

  // 上次同步看到的远端 updated_at（ISO 字符串）。读取用于冲突检测。
  getLastRemoteUpdatedAt(): string {
    return localStorage.getItem(SYNC_LAST_REMOTE_UPDATED_AT) || ""
  }

  private getLastEtag(): string {
    return localStorage.getItem(SYNC_LAST_ETAG) || ""
  }

  // 在我们成功 push/pull 后调用，记录此时已知的远端版本，作为下次冲突检测的基准
  private saveSyncedRemoteState(updatedAt?: string, etag?: string) {
    if (updatedAt) {
      localStorage.setItem(SYNC_LAST_REMOTE_UPDATED_AT, updatedAt)
    }
    if (etag) {
      localStorage.setItem(SYNC_LAST_ETAG, etag)
    }
  }

  clearSyncedRemoteState() {
    localStorage.removeItem(SYNC_LAST_REMOTE_UPDATED_AT)
    localStorage.removeItem(SYNC_LAST_ETAG)
  }

  private buildHeaders(
    extra: Record<string, string> = {},
  ): Record<string, string> {
    const syncType = localStorage.getItem(SYNC_TYPE)
    if (syncType === "gitee") {
      // Gitee 的 Gist API 用 token 风格鉴权，且不识别 GitHub 的 vnd.github / api-version 头。
      return {
        Accept: "application/json",
        Authorization: `token ${this.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        ...extra,
      }
    }
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...extra,
    }
  }

  // 通用 fetch；返回 { data, response } 让上层能读 ETag 等 header
  private async rawRequest(options: {
    endpoint: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    body?: any
    extraHeaders?: Record<string, string>
    treatNotModified?: boolean
  }): Promise<{ response: Response; data?: any }> {
    if (!this.ACCESS_TOKEN) {
      throw new Error("未设置 Token")
    }
    const { endpoint, method, body, extraHeaders, treatNotModified } = options
    const response = await fetch(`${this.API}${endpoint}`, {
      method,
      headers: this.buildHeaders(extraHeaders),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (treatNotModified && response.status === 304) {
      return { response }
    }
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gist API error: ${response.status} ${errorText}`)
    }
    const data = await response.json()
    return { response, data }
  }

  // 仅返回数据的兼容接口（保留给少数不关心 header 的调用方）
  async request<T>(options: {
    endpoint: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    body?: any
  }): Promise<T> {
    const { data } = await this.rawRequest(options)
    return data as T
  }

  private buildFiles(data: Partial<SyncData>) {
    const files: { [key: string]: { content: string } } = {}
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        files[key] = { content: compressToUTF16(JSON.stringify(value)) }
      }
    })
    return files
  }

  private parseFiles(files: GistRawResponse["files"]): SyncData {
    return {
      spaces: this.parseCompressed(files?.spaces?.content),
      collections: this.parseCompressed(files?.collections?.content),
      labels: this.parseCompressed(files?.labels?.content),
      cards: this.parseCompressed(files?.cards?.content),
      favicons: this.parseCompressed(files?.favicons?.content),
    }
  }

  async createGist(data: SyncData) {
    const files: { [key: string]: { content: string } } = {}
    if (data.spaces?.length)
      files.spaces = { content: compressToUTF16(JSON.stringify(data.spaces)) }
    if (data.collections?.length)
      files.collections = {
        content: compressToUTF16(JSON.stringify(data.collections)),
      }
    if (data.cards?.length)
      files.cards = { content: compressToUTF16(JSON.stringify(data.cards)) }
    if (data.labels?.length)
      files.labels = { content: compressToUTF16(JSON.stringify(data.labels)) }
    if (data.favicons?.length)
      files.favicons = {
        content: compressToUTF16(JSON.stringify(data.favicons)),
      }

    const { response, data: body } = await this.rawRequest({
      endpoint: "/gists",
      method: "POST",
      body: { description: "Taby Backup", public: false, files },
    })
    const etag = response.headers.get("ETag") ?? undefined
    this.saveSyncedRemoteState(body?.updated_at, etag)
    return body.id as string
  }

  async updateGist(data: Partial<SyncData>) {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const files = this.buildFiles(data)
    const { response, data: body } = await this.rawRequest({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "PATCH",
      body: { files },
    })
    const etag = response.headers.get("ETag") ?? undefined
    this.saveSyncedRemoteState(body?.updated_at, etag)
    return body
  }

  async fetchGist(): Promise<SyncData> {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const { response, data: body } = await this.rawRequest({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "GET",
    })
    const etag = response.headers.get("ETag") ?? undefined
    this.saveSyncedRemoteState(body?.updated_at, etag)
    return this.parseFiles(body.files)
  }

  // 仅用于上传前的冲突检测：尽量利用 If-None-Match 让服务端返回 304 不传 body。
  // 注意：这里**不会**自动写入 lastSeen / etag —— 只有在调用方据此采取行动后再决定是否落库。
  async fetchGistMeta(): Promise<{
    notModified: boolean
    updatedAt?: string
    etag?: string
    data?: SyncData
  }> {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const lastEtag = this.getLastEtag()
    const extraHeaders: Record<string, string> = {}
    if (lastEtag) extraHeaders["If-None-Match"] = lastEtag

    const { response, data: body } = await this.rawRequest({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "GET",
      extraHeaders,
      treatNotModified: true,
    })
    if (response.status === 304) {
      return { notModified: true }
    }
    return {
      notModified: false,
      updatedAt: body?.updated_at,
      etag: response.headers.get("ETag") ?? undefined,
      data: this.parseFiles(body.files),
    }
  }

  // 由 syncManager 在用户解决冲突后调用，把已知的远端版本提升到给定值
  commitSyncedRemoteState(updatedAt?: string, etag?: string) {
    this.saveSyncedRemoteState(updatedAt, etag)
  }

  private parseCompressed(content: string | undefined): any[] {
    if (!content) return []
    const decompressed = decompressFromUTF16(content)
    if (!decompressed) return []
    try {
      return JSON.parse(decompressed)
    } catch {
      return []
    }
  }

  async uploadData(data: Partial<SyncData>) {
    if (!this.GIST_ID) {
      this.GIST_ID = await this.createGist(data as SyncData)
      localStorage.setItem(SYNC_GIST_ID, this.GIST_ID)
    } else {
      await this.updateGist(data)
    }
    return this.GIST_ID
  }

  async downloadAll() {
    return await this.fetchGist()
  }

  async fetchGistVersions() {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const res = await this.request<
      Array<{
        version: string
        committed_at: string
        url: string
      }>
    >({
      endpoint: `/gists/${this.GIST_ID}/commits`,
      method: "GET",
    })
    return res.map((item) => ({
      version: item.version,
      committedAt: item.committed_at,
      url: item.url,
    }))
  }

  async fetchGistByVersion(version: string) {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const res = await this.request<GistRawResponse>({
      endpoint: `/gists/${this.GIST_ID}/${version}`,
      method: "GET",
    })
    return this.parseFiles(res.files)
  }
}

export default GistManager.getInstance()
