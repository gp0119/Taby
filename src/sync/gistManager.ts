import { SyncData } from "@/type.ts"
import {
  GITHUB_API,
  GITEE_API,
  SYNC_TYPE,
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
} from "@/utils/constants.ts"
import { decompressFromUTF16 } from "lz-string"
import { compressWithPako, decompressWithPako } from "@/utils/index.ts"

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
      files.spaces = { content: compressWithPako(JSON.stringify(spaces)) }
    }
    if (collections && collections.length > 0) {
      files.collections = {
        content: compressWithPako(JSON.stringify(collections)),
      }
    }
    if (cards && cards.length > 0) {
      files.cards = { content: compressWithPako(JSON.stringify(cards)) }
    }
    if (labels && labels.length > 0) {
      files.labels = { content: compressWithPako(JSON.stringify(labels)) }
    }
    if (favicons && favicons.length > 0) {
      files.favicons = { content: compressWithPako(JSON.stringify(favicons)) }
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
        files[key] = { content: compressWithPako(JSON.stringify(value)) }
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
        spaces?: { content: string }
        collections?: { content: string }
        labels?: { content: string }
        cards?: { content: string }
        favicons?: { content: string }
      }
    }>({
      endpoint: `/gists/${this.GIST_ID}`,
      method: "GET",
    })

    const tryDecompress = (
      file: { content: string } | undefined,
      fileName: string,
    ): any[] => {
      if (!file || !file.content) {
        return []
      }
      let decompressedString: string | null = null
      try {
        const uint8Array = decompressWithPako(file.content)
        decompressedString = new TextDecoder().decode(uint8Array)
        return JSON.parse(decompressedString)
      } catch (e) {
        try {
          decompressedString = decompressFromUTF16(file.content)
          if (decompressedString) {
            return JSON.parse(decompressedString)
          } else {
            console.warn(
              `Decompressing ${fileName} with lz-string resulted in null or empty string.`,
            )
            return []
          }
        } catch (e2) {
          console.error(
            `Failed to decompress ${fileName} with both pako and lz-string:`,
            e2,
            `Original pako error: ${e}`,
          )
          return []
        }
      }
    }

    const remoteData: SyncData = {
      spaces: tryDecompress(res.files.spaces, "spaces"),
      collections: tryDecompress(res.files.collections, "collections"),
      labels: tryDecompress(res.files.labels, "labels"),
      cards: tryDecompress(res.files.cards, "cards"),
      favicons: tryDecompress(res.files.favicons, "favicons"),
    }
    return remoteData
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
