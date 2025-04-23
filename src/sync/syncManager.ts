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
    localStorage.removeItem("lastModifiedTime")
    return result
  }

  uploadModifiedTablesImmediate = async () => {
    const modifiedData: Partial<SyncData> = await db.getModifiedTables()
    if (isEmpty(modifiedData)) return
    await GistManager.uploadData(modifiedData)
    await db.clearModifiedTable()
    localStorage.removeItem("lastModifiedTime")
  }

  uploadModifiedTablesDebounce = debounce(
    this.uploadModifiedTablesImmediate,
    this.SYNC_INTERVAL,
    {
      leading: false,
      trailing: true,
    },
  )

  triggerUpload = async () => {
    localStorage.setItem("lastModifiedTime", Date.now() + "")
    await this.uploadModifiedTablesDebounce()
  }

  triggerDownload = async () => {
    const data = await GistManager.downloadAll()
    await db.importData(data)
    localStorage.setItem("lastSyncTime", Date.now() + "")
    return data
  }

  autoDownload = async () => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return
    const lastSyncTime = localStorage.getItem("lastSyncTime")
    if (!lastSyncTime) {
      await this.triggerDownload()
      return
    } else {
      if (Date.now() - Number(lastSyncTime) > this.AUTO_DOWNLOAD_INTERVAL) {
        await this.triggerDownload()
      }
    }
  }

  autoUpload = async () => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return
    const modifiedTables = localStorage.getItem("modifiedTables")
    if (modifiedTables) {
      const lastModifiedTime = localStorage.getItem("lastModifiedTime")
      const tables = JSON.parse(modifiedTables)
      if (
        tables.length > 0 &&
        Date.now() - Number(lastModifiedTime) > this.SYNC_INTERVAL
      ) {
        this.uploadModifiedTablesImmediate()
      }
    } else {
      localStorage.removeItem("lastModifiedTime")
    }
  }
}

export default SyncManager.getInstance()
