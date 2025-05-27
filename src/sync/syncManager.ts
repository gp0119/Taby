import { db } from "@/db/database.ts"
import dataManager from "@/db/index.ts"
import GistManager from "@/sync/gistManager.ts"
import { SyncData, SyncTokenData } from "@/type.ts"
import { debounce, isEmpty } from "lodash-es"
import {
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
  LOCAL_LAST_DOWNLOAD_TIME,
  REMOTE_LAST_UPDATE_TIME,
} from "@/utils/constants.ts"
import { EntityTable } from "dexie"

class SyncManager {
  private static instance: SyncManager
  SYNC_INTERVAL = 1000 * 60 * 5 // 5 minutes
  modifiedTables: Set<string> = new Set()

  constructor() {
    this.addHooks()
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  async addModifiedTable(tableName: string) {
    this.modifiedTables.add(tableName)
    localStorage.setItem(
      "modifiedTables",
      JSON.stringify([...this.modifiedTables]),
    )
  }

  async clearModifiedTable() {
    this.modifiedTables.clear()
    localStorage.removeItem("modifiedTables")
    localStorage.removeItem("lastModifiedTime")
  }

  addHooks() {
    const tableMapping = [
      { table: db.spaces, name: "spaces" },
      { table: db.collections, name: "collections" },
      { table: db.labels, name: "labels" },
      { table: db.cards, name: "cards" },
      { table: db.favicons, name: "favicons" },
    ]
    const self = this
    tableMapping.forEach(({ table, name }) => {
      table.hook("creating", function () {
        // console.log("creating", name, obj)
        self.addModifiedTable(name)
        self.triggerUpload()
      })
      table.hook("updating", function () {
        // console.log("updating")
        self.addModifiedTable(name)
        self.triggerUpload()
      })
      table.hook("deleting", function () {
        // console.log("deleting")
        self.addModifiedTable(name)
        self.triggerUpload()
      })
    })
  }

  async getModifiedTables() {
    const modifiedData: Partial<SyncData> = {}
    const modifiedTables = JSON.parse(
      localStorage.getItem("modifiedTables") || "[]",
    )
    console.log("modifiedTables: ", modifiedTables)
    for (const tableName of modifiedTables) {
      const table = db[tableName as keyof typeof db]
      modifiedData[tableName as keyof SyncData] = await (
        table as EntityTable<any, any>
      ).toArray()
    }
    return modifiedData
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
    const data: Partial<SyncData> = await dataManager.getUploadData()
    if (!data) return
    const result = await GistManager.uploadData(data)
    const now = Date.now()
    await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
    await this.clearModifiedTable()
    return result
  }

  uploadModifiedTablesImmediate = async () => {
    const modifiedData: Partial<SyncData> = await this.getModifiedTables()
    if (isEmpty(modifiedData)) return
    await GistManager.uploadData(modifiedData)
    const now = Date.now()
    await chrome.storage.sync.set({ [REMOTE_LAST_UPDATE_TIME]: now })
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, now + "")
    await this.clearModifiedTable()
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
    await dataManager.importData(data)
    await this.clearModifiedTable()
    localStorage.setItem(LOCAL_LAST_DOWNLOAD_TIME, Date.now() + "")
    return data
  }

  autoDownload = async () => {
    return new Promise(async (resolve) => {
      const { accessToken, gistId } = await this.getToken()
      if (!accessToken || !gistId) {
        resolve(false)
        return
      }
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
          resolve(true)
        } else {
          console.log("Local data is up-to-date, skipping download.", {
            remoteUpdateTime,
            localDownloadTime,
          })
          resolve(false)
        }
      } catch (error) {
        console.error("Error during autoDownload check:", error)
        resolve(false)
      }
    })
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
