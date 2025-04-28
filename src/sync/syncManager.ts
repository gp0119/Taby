import { db } from "@/db/database.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData, SyncTokenData } from "@/type.ts"
import { debounce, isEmpty } from "lodash-es"
import {
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
  LOCAL_LAST_DOWNLOAD_TIME,
  REMOTE_LAST_UPDATE_TIME,
} from "@/utils/constants.ts"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes

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
    const now = Date.now()
    await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
    await db.clearModifiedTable()
    localStorage.removeItem("lastModifiedTime")
    return result
  }

  uploadModifiedTablesImmediate = async () => {
    const modifiedData: Partial<SyncData> = await db.getModifiedTables()
    if (isEmpty(modifiedData)) return
    await GistManager.uploadData(modifiedData)
    const now = Date.now()
    await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
    await db.clearModifiedTable()
    localStorage.removeItem("lastModifiedTime")
  }

  uploadModifiedTablesDebounce = debounce(
    this.uploadModifiedTablesImmediate,
    this.SYNC_INTERVAL,
    { leading: false, trailing: true },
  )

  triggerUpload = async () => {
    localStorage.setItem("lastModifiedTime", Date.now() + "")
    await this.uploadModifiedTablesDebounce()
  }

  triggerDownload = async () => {
    const data = await GistManager.downloadAll()
    await db.importData(data)
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, Date.now() + "")
    return data
  }

  autoDownload = async () => {
    const { accessToken, gistId } = await this.getToken()
    if (!accessToken || !gistId) return
    try {
      const syncStorage = await chrome.storage.sync.get([
        REMOTE_LAST_UPDATE_TIME,
      ])
      const remoteUpdateTime = syncStorage[REMOTE_LAST_UPDATE_TIME]
      const localDownloadTimeStr = localStorage.getItem(
        LOCAL_LAST_DOWNLOAD_TIME,
      )
      const localDownloadTime = localDownloadTimeStr
        ? Number(localDownloadTimeStr)
        : 0

      if (
        !localDownloadTime ||
        (remoteUpdateTime && remoteUpdateTime > localDownloadTime)
      ) {
        console.log("Remote Gist potentially newer, downloading...", {
          remoteUpdateTime,
          localDownloadTime,
        })
        await this.triggerDownload()
      } else {
        console.log("Local data is up-to-date, skipping download.", {
          remoteUpdateTime,
          localDownloadTime,
        })
      }
    } catch (error) {
      console.error("Error during autoDownload check:", error)
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
