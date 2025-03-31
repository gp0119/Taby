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
  private API = GITHUB_API
  private ACCESS_TOKEN = ""
  private GIST_ID = ""
  private static instance: GistManager
  public static getInstance(): GistManager {
    if (!GistManager.instance) {
      GistManager.instance = new GistManager()
    }
    return GistManager.instance
  }
  constructor() {
    this.getEnv()
  }

  getEnv() {
    const syncType = localStorage.getItem(SYNC_TYPE)
    const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
    const gistId = localStorage.getItem(SYNC_GIST_ID)
    if (syncType === "gitee") {
      this.API = GITEE_API
    } else {
      this.API = GITHUB_API
    }
    this.ACCESS_TOKEN = accessToken || ""
    this.GIST_ID = gistId || ""
  }

  setEnv(key: string, value: string) {
    if (key === SYNC_TYPE) {
      this.API = value === "gitee" ? GITEE_API : GITHUB_API
    } else if (key === SYNC_GIST_TOKEN) {
      this.ACCESS_TOKEN = value
    } else if (key === SYNC_GIST_ID) {
      this.GIST_ID = value
    }
  }

  async request<T>(options: {
    endpoint: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    body?: any
  }): Promise<T> {
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
    const files: { [key: string]: { content: string } } = {}
    Object.entries(data).forEach(([key, value]) => {
      if (value)
        files[key] = { content: compressToUTF16(JSON.stringify(value)) }
    })

    return this.request({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "PATCH",
      body: { files },
    })
  }
  async fetchGist() {
    const res = await this.request<{
      files: {
        spaces: { content: string }
        collections: { content: string }
        labels: { content: string }
        cards: { content: string }
        favicons: { content: string }
        "taby-backup.json": { content: string }
      }
    }>({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "GET",
    })
    // 兼容老数据
    if (res.files.spaces || res.files.collections) {
      const { spaces, collections, labels, cards, favicons } = res.files
      const remoteData: SyncData = {
        spaces: spaces ? JSON.parse(decompressFromUTF16(spaces.content)) : [],
        collections: collections
          ? JSON.parse(decompressFromUTF16(collections.content))
          : [],
        labels: labels ? JSON.parse(decompressFromUTF16(labels.content)) : [],
        cards: cards ? JSON.parse(decompressFromUTF16(cards.content)) : [],
        favicons: favicons
          ? JSON.parse(decompressFromUTF16(favicons.content))
          : [],
      }
      console.log("new remoteData: ", remoteData)
      return remoteData
    } else {
      const compressedContent = res.files["taby-backup.json"].content
      if (!compressedContent) throw new Error("远程数据为空")
      const remoteData: SyncData = JSON.parse(
        decompressFromUTF16(compressedContent),
      )
      console.log("old remoteData: ", remoteData)
      return remoteData
    }
  }

  async uploadData(data: Partial<SyncData>) {
    if (!this.GIST_ID) {
      this.GIST_ID = await this.createGist(data as SyncData)
    } else {
      await this.updateGist(data)
    }
    return this.GIST_ID
  }

  async downloadAll() {
    return await this.fetchGist()
  }
}

export default GistManager.getInstance()
