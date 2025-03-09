import { db } from "@/db/database.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData } from "@/type.ts"
import { SYNC_GIST_ID, SYNC_GIST_TOKEN } from "@/utils/constants.ts"
import { debounce, isEmpty } from "lodash-es"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 3
  AUTO_DOWNLOAD_INTERVAL = 1000 * 60 * 60

  constructor() {}

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  getToken = async () => {
    return chrome.storage.sync.get([SYNC_GIST_TOKEN, SYNC_GIST_ID])
  }

  uploadNow = async (token: string, id?: string) => {
    const data: Partial<SyncData> = await db.exportData()
    if (!data) return
    return GistManager.uploadAll(token!, data, id)
  }

  triggerUpload = debounce(async (token?: string, id?: string) => {
    if (!token) {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken || !gistId) return
      token = accessToken
      id = gistId
    }
    const modifiedData: Partial<SyncData> = await db.getModifiedTables()
    console.log("modifiedData: ", modifiedData)
    if (isEmpty(modifiedData)) return
    await GistManager.uploadAll(token!, modifiedData, id)
  }, this.SYNC_INTERVAL)

  triggerDownload = async (token?: string, id?: string) => {
    if (!token) {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken || !gistId) return
      token = accessToken
      id = gistId
    }
    const data = await GistManager.downloadAll(token!, id!)
    console.log("data: ", data)
    await db.importData(data)
    return data
  }

  autoDownload = async () => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return
    const lastSyncTime = localStorage.getItem("lastSyncTime")
    if (!lastSyncTime) {
      await this.triggerDownload()
      localStorage.setItem("lastSyncTime", Date.now() + "")
      return
    } else {
      if (Date.now() - Number(lastSyncTime) > this.AUTO_DOWNLOAD_INTERVAL) {
        await this.triggerDownload()
        localStorage.setItem("lastSyncTime", Date.now() + "")
      }
    }
  }
}

export default SyncManager.getInstance()
