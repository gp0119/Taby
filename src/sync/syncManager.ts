import { db } from "@/db/database.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData, SyncTokenData } from "@/type.ts"
import { SYNC_GIST_ID, SYNC_GIST_TOKEN } from "@/utils/constants.ts"
import { debounce, isEmpty } from "lodash-es"

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
    const result = await chrome.storage.sync.get([
      SYNC_GIST_TOKEN,
      SYNC_GIST_ID,
    ])
    return {
      accessToken: result[SYNC_GIST_TOKEN],
      gistId: result[SYNC_GIST_ID],
    }
  }

  uploadNow = async (token: string, id?: string) => {
    const data: Partial<SyncData> = await db.exportData()
    if (!data) return
    return GistManager.uploadAll(token!, data, id)
  }

  triggerUpload = debounce(
    async (token?: string, id?: string) => {
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
      await db.clearModifiedTable()
    },
    this.SYNC_INTERVAL,
    {
      leading: false,
      trailing: true,
    },
  )

  triggerDownload = async (token?: string, id?: string) => {
    if (!token) {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken || !gistId) return
      token = accessToken
      id = gistId
    }
    const data = await GistManager.downloadAll(token!, id!)
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
        await this.triggerUpload(accessToken, gistId)
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
