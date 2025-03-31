import { db } from "@/db/database.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData, SyncTokenData } from "@/type.ts"
import { debounce, isEmpty } from "lodash-es"
import { SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  AUTO_DOWNLOAD_INTERVAL = 1000 * 60 * 60 * 3 // 3 hours

  constructor() {}

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  getToken = async (): Promise<SyncTokenData> => {
    const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
    const gistId = localStorage.getItem(SYNC_GIST_ID)
    return {
      accessToken: accessToken || "",
      gistId: gistId || "",
    }
  }

  setEnv(key: string, value: string) {
    GistManager.setEnv(key, value)
  }

  uploadAll = async () => {
    const data: Partial<SyncData> = await db.exportData()
    if (!data) return
    const result = await GistManager.uploadData(data)
    await db.clearModifiedTable()
    return result
  }

  triggerUpload = debounce(
    async () => {
      const modifiedData: Partial<SyncData> = await db.getModifiedTables()
      console.log("modifiedData: ", modifiedData)
      if (isEmpty(modifiedData)) return
      await GistManager.uploadData(modifiedData)
      await db.clearModifiedTable()
    },
    this.SYNC_INTERVAL,
    {
      leading: false,
      trailing: true,
    },
  )

  triggerDownload = async () => {
    const data = await GistManager.downloadAll()
    await db.importData(data)
    localStorage.setItem("lastSyncTime", Date.now() + "")
    return data
  }

  autoSync = async () => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return
    const modifiedTables = localStorage.getItem("modifiedTables")
    const lastSyncTime = localStorage.getItem("lastSyncTime")
    if (modifiedTables) {
      const tables = JSON.parse(modifiedTables)
      if (tables.length > 0) {
        await this.triggerUpload()
      }
    } else {
      if (!lastSyncTime) {
        await this.triggerDownload()
        return
      } else {
        if (Date.now() - Number(lastSyncTime) > this.AUTO_DOWNLOAD_INTERVAL) {
          await this.triggerDownload()
        }
      }
    }
  }
}

export default SyncManager.getInstance()
