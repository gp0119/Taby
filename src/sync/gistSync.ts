import { Octokit } from "@octokit/rest"
import { db } from "@/db/database"
import { SyncData } from "@/type"
import { compressToUTF16, decompressFromUTF16 } from "lz-string"

// 更新最后同步时间
const updateLastSyncTime = async () => {
  await chrome.storage.sync.set({ lastSyncAt: Date.now() })
}

// 创建 Octokit 实例
const createOctokit = (token: string) => new Octokit({ auth: token })

export const createGist = async (
  token: string,
  data: {
    description?: string
    public: boolean
    files: { "taby-backup.json": { content: string } }
  },
) => {
  const octokit = createOctokit(token)
  const gist = await octokit.gists.create(data)
  return gist.data.id
}

export const updateGist = async (
  token: string,
  data: {
    gist_id: string
    description?: string
    public: boolean
    files: { "taby-backup.json": { content: string } }
  },
) => {
  const octokit = createOctokit(token)
  await octokit.gists.update(data)
}

// 上传本地数据到 Gist
export const uploadAll = async (token: string, gistId?: string) => {
  const localData = await db.exportData()
  const compressed = compressToUTF16(JSON.stringify(localData))
  const data = {
    description: "Taby Backup",
    public: false,
    files: { "taby-backup.json": { content: compressed } },
  }
  if (!gistId) {
    gistId = await createGist(token, data)
  } else {
    await updateGist(token, { gist_id: gistId, ...data })
  }
  await updateLastSyncTime()
  return gistId
}

// 从 Gist 下载数据
export const downloadAll = async (token: string, gistId: string) => {
  const octokit = createOctokit(token)
  const gist = (await octokit.gists.get({ gist_id: gistId })) as unknown as {
    data: { files: { "taby-backup.json": { content: string } } }
  }
  const compressedContent = gist.data.files["taby-backup.json"]?.content
  if (!compressedContent) throw new Error("远程数据为空")
  const remoteData: SyncData = JSON.parse(
    decompressFromUTF16(compressedContent),
  )
  await db.transaction(
    "rw",
    [db.spaces, db.collections, db.labels, db.cards],
    async () => {
      await db.importData(remoteData)
    },
  )

  await updateLastSyncTime()
}
