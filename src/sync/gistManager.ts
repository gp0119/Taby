import { SyncData } from "@/type.ts"
import { GITHUB_API } from "@/utils/constants.ts"
import { compressToUTF16, decompressFromUTF16 } from "lz-string"

class GistManager {
  private static instance: GistManager
  public static getInstance(): GistManager {
    if (!GistManager.instance) {
      GistManager.instance = new GistManager()
    }
    return GistManager.instance
  }

  constructor() {}

  async request<T>(options: {
    endpoint: string
    method: "GET" | "POST" | "PATCH" | "DELETE"
    token: string
    body?: any
  }): Promise<T> {
    const { endpoint, method, token, body } = options
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
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
  async createGist(token: string, data: SyncData) {
    const { spaces, collections, labels, cards } = data
    const res = await this.request<{
      id: string
    }>({
      endpoint: "/gists",
      method: "POST",
      token,
      body: {
        description: "Taby Backup",
        public: false,
        files: {
          spaces: { content: compressToUTF16(JSON.stringify(spaces)) },
          collections: {
            content: compressToUTF16(JSON.stringify(collections)),
          },
          labels: { content: compressToUTF16(JSON.stringify(labels)) },
          cards: { content: compressToUTF16(JSON.stringify(cards)) },
        },
      },
    })
    return res.id
  }
  async updateGist(token: string, gistId: string, data: Partial<SyncData>) {
    const files: { [key: string]: { content: string } } = {}
    Object.entries(data).forEach(([key, value]) => {
      if (value)
        files[key] = { content: compressToUTF16(JSON.stringify(value)) }
    })
    return this.request({
      endpoint: `/gists/${gistId}`,
      method: "PATCH",
      token,
      body: { files },
    })
  }
  async fetchGist(token: string, gistId: string) {
    const res = await this.request<{
      files: {
        spaces: { content: string }
        collections: { content: string }
        labels: { content: string }
        cards: { content: string }
        "taby-backup.json": { content: string }
      }
    }>({
      endpoint: `/gists/${gistId}`,
      method: "GET",
      token,
    })
    // 兼容老数据
    if (res.files["taby-backup.json"].content) {
      const compressedContent = res.files["taby-backup.json"].content
      if (!compressedContent) throw new Error("远程数据为空")
      const remoteData: SyncData = JSON.parse(
        decompressFromUTF16(compressedContent),
      )
      return remoteData
    } else {
      const { spaces, collections, labels, cards } = res.files
      const remoteData: SyncData = {
        spaces: JSON.parse(decompressFromUTF16(spaces.content)),
        collections: JSON.parse(decompressFromUTF16(collections.content)),
        labels: JSON.parse(decompressFromUTF16(labels.content)),
        cards: JSON.parse(decompressFromUTF16(cards.content)),
      }
      return remoteData
    }
  }
  async uploadAll(token: string, data: Partial<SyncData>, gistId?: string) {
    if (!gistId) {
      gistId = await this.createGist(token, data as SyncData)
    } else {
      await this.updateGist(token, gistId, data)
    }
    return gistId
  }
  async downloadAll(token: string, gistId: string) {
    return await this.fetchGist(token, gistId)
  }
}

export default GistManager.getInstance()
