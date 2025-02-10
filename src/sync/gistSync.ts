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

// 获取本地所有数据
const getAllLocalData = async (): Promise<SyncData> => ({
  spaces: await db.spaces.toArray(),
  collections: await db.collections.toArray(),
  labels: await db.labels.toArray(),
  cards: await db.cards.toArray(),
  timestamp: Date.now(),
})

// 清空本地数据
const clearLocalData = async () => {
  await Promise.all([
    db.spaces.clear(),
    db.collections.clear(),
    db.labels.clear(),
    db.cards.clear(),
  ])
}

// 批量添加数据
const bulkAddData = async (data: SyncData) => {
  await Promise.all([
    db.spaces.bulkAdd(data.spaces),
    db.collections.bulkAdd(data.collections),
    db.labels.bulkAdd(data.labels),
    db.cards.bulkAdd(data.cards),
  ])
}

// 上传本地数据到 Gist
export const uploadAll = async (token: string, gistId: string) => {
  const octokit = createOctokit(token)
  const localData = await getAllLocalData()
  const compressed = compressToUTF16(JSON.stringify(localData))
  await octokit.gists.update({
    gist_id: gistId,
    files: {
      "tabby-backup.json": { content: compressed },
    },
  })

  await updateLastSyncTime()
}

// 从 Gist 下载数据
export const downloadAll = async (token: string, gistId: string) => {
  const octokit = createOctokit(token)
  const gist = (await octokit.gists.get({ gist_id: gistId })) as unknown as {
    data: { files: { "tabby-backup.json": { content: string } } }
  }
  const compressedContent = gist.data.files["tabby-backup.json"]?.content
  if (!compressedContent) throw new Error("远程数据为空")
  const remoteData: SyncData = JSON.parse(
    decompressFromUTF16(compressedContent),
  )
  await db.transaction(
    "rw",
    [db.spaces, db.collections, db.labels, db.cards],
    async () => {
      await clearLocalData()
      await bulkAddData(remoteData)
    },
  )

  await updateLastSyncTime()
}
