import { SyncData } from "@/type.ts"
import {
  GITHUB_API,
  GITEE_API,
  SYNC_TYPE,
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
} from "@/utils/constants.ts"
import { compressToUTF16, decompressFromUTF16 } from "lz-string"

class GistManager {
  private static instance: GistManager

  // 从 localStorage 读取，确保多页面同步
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

  setEnv(key: string, value: string) {
    localStorage.setItem(key, value)
  }

  async request<T>(options: {
    endpoint: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    body?: any
  }): Promise<T> {
    if (!this.ACCESS_TOKEN) {
      throw new Error("未设置 Token")
    }
    const { endpoint, method, body } = options
    const response = await fetch(`${this.API}${endpoint}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub API错误: ${response.status} ${errorText}`)
    }
    return (await response.json()) as T
  }

  async createGist(data: SyncData) {
    const { spaces, collections, labels, cards, favicons } = data
    const files: { [key: string]: { content: string } } = {}
    if (spaces && spaces.length > 0) {
      files.spaces = { content: compressToUTF16(JSON.stringify(spaces)) }
    }
    if (collections && collections.length > 0) {
      files.collections = {
        content: compressToUTF16(JSON.stringify(collections)),
      }
    }
    if (cards && cards.length > 0) {
      files.cards = { content: compressToUTF16(JSON.stringify(cards)) }
    }
    if (labels && labels.length > 0) {
      files.labels = { content: compressToUTF16(JSON.stringify(labels)) }
    }
    if (favicons && favicons.length > 0) {
      files.favicons = { content: compressToUTF16(JSON.stringify(favicons)) }
    }
    const res = await this.request<{
      id: string
    }>({
      endpoint: "/gists",
      method: "POST",
      body: {
        description: "Taby Backup",
        public: false,
        files,
      },
    })
    return res.id
  }
  async updateGist(data: Partial<SyncData>) {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const files: { [key: string]: { content: string } } = {}
    Object.entries(data).forEach(([key, value]) => {
      if (value)
        files[key] = { content: compressToUTF16(JSON.stringify(value)) }
    })

    return this.request({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "PATCH",
      body: {
        files,
      },
    })
  }
  async fetchGist() {
    if (!this.GIST_ID) {
      throw new Error("未设置 Gist ID")
    }
    const res = await this.request<{
      description: string
      files: {
        spaces: { content: string }
        collections: { content: string }
        labels: { content: string }
        cards: { content: string }
        favicons: { content: string }
      }
    }>({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "GET",
    })
    const { spaces, collections, labels, cards, favicons } = res.files
    const remoteData: SyncData = {
      spaces: this.parseCompressed(spaces?.content),
      collections: this.parseCompressed(collections?.content),
      labels: this.parseCompressed(labels?.content),
      cards: this.parseCompressed(cards?.content),
      favicons: this.parseCompressed(favicons?.content),
    }
    return remoteData
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
    const res = await this.request<{
      files: {
        spaces: { content: string }
        collections: { content: string }
        labels: { content: string }
        cards: { content: string }
        favicons: { content: string }
      }
    }>({
      endpoint: `/gists/${this.GIST_ID}/${version}`,
      method: "GET",
    })
    const { spaces, collections, labels, cards, favicons } = res.files
    const remoteData: SyncData = {
      spaces: this.parseCompressed(spaces?.content),
      collections: this.parseCompressed(collections?.content),
      labels: this.parseCompressed(labels?.content),
      cards: this.parseCompressed(cards?.content),
      favicons: this.parseCompressed(favicons?.content),
    }
    return remoteData
  }
}

export default GistManager.getInstance()
