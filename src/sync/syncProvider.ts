import GistManager from "@/sync/gistManager.ts"
import WebdavManager from "@/sync/webdavManager.ts"
import { SyncData } from "@/type.ts"
import { SYNC_GIST_ID, SYNC_GIST_TOKEN, SYNC_TYPE } from "@/utils/constants.ts"
import { hasWebdavConfig } from "@/sync/webdavConfig.ts"

export type SyncProviderType = "github" | "gitee" | "webdav"

export interface RemoteMeta {
  notModified: boolean
  updatedAt?: string
  etag?: string
  data?: SyncData
}

export interface SyncRemoteProvider {
  uploadData(data: Partial<SyncData>): Promise<string>
  downloadAll(): Promise<SyncData>
  fetchRemoteMeta(): Promise<RemoteMeta>
  clearSyncedRemoteState(): void
  getLastRemoteUpdatedAt(): string
  getLastEtag(): string
  commitSyncedRemoteState(updatedAt?: string, etag?: string): void
}

export const getSyncProviderType = (): SyncProviderType => {
  const syncType = localStorage.getItem(SYNC_TYPE)
  return syncType === "gitee" || syncType === "webdav" ? syncType : "github"
}

export const isWebdavSync = () => getSyncProviderType() === "webdav"

export const getSyncProvider = (): SyncRemoteProvider => {
  return isWebdavSync() ? WebdavManager : GistManager
}

export const hasSyncConfig = (mode: "upload" | "download") => {
  if (isWebdavSync()) {
    return hasWebdavConfig()
  }

  const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
  const gistId = localStorage.getItem(SYNC_GIST_ID)
  return mode === "upload" ? !!accessToken : !!(accessToken && gistId)
}
