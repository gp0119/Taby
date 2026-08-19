import { createGistManager } from "@/sync/gistManager.ts"
import { createWebdavManager } from "@/sync/webdavManager.ts"
import { SyncData } from "@/type.ts"
import { getWebdavConfig, hasWebdavConfig } from "@/sync/webdavConfig.ts"
import {
  getBackupProviderTypes,
  getGistCapability,
  getGistConfig,
  getGistConfigValues,
  getLegacySyncConfigMigration,
  getSyncProviderType,
  LEGACY_SYNC_STATE_KEYS,
} from "@/sync/syncConfig.ts"
import type { GistConfig, SyncProviderType } from "@/sync/syncConfig.ts"
import { hasExtensionSyncStorage } from "@/utils/platform"

export type { SyncProviderType } from "@/sync/syncConfig.ts"

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

export interface SyncTarget {
  type: SyncProviderType
  provider: SyncRemoteProvider
  canUpload: boolean
  canDownload: boolean
  targetChanged?: boolean
}

export interface SyncTargets {
  primary: SyncTarget
  backups: SyncTarget[]
}

export const persistSyncValues = async (values: Record<string, string>) => {
  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  if (hasExtensionSyncStorage()) {
    await chrome.storage.sync.set(values)
  }
}

export const persistCreatedGist = async (
  config: GistConfig,
  gistId: string,
) => {
  await persistSyncValues(getGistConfigValues({ ...config, gistId }))
}

export const getSyncTarget = (type: SyncProviderType): SyncTarget => {
  if (type === "webdav") {
    const config = getWebdavConfig()
    const hasConfig = hasWebdavConfig(config)
    return {
      type,
      provider: createWebdavManager(config),
      canUpload: hasConfig,
      canDownload: hasConfig,
    }
  }

  const config = getGistConfig(type)
  return {
    type,
    provider: createGistManager(config, (gistId) =>
      persistCreatedGist(config, gistId),
    ),
    ...getGistCapability(config),
  }
}

export const getSyncTargets = (): SyncTargets => ({
  primary: getSyncTarget(getSyncProviderType()),
  backups: getBackupProviderTypes().map(getSyncTarget),
})

export const hasSyncConfig = (mode: "upload" | "download") => {
  const type = getSyncProviderType()
  if (type === "webdav") return hasWebdavConfig()
  const { canUpload, canDownload } = getGistCapability(getGistConfig(type))
  return mode === "upload" ? canUpload : canDownload
}

export const migrateSyncConfig = async () => {
  const values = getLegacySyncConfigMigration(localStorage)
  if (!Object.keys(values).length) return

  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  // 状态已按 provider 重新落库，旧的无后缀键不再有人读取
  LEGACY_SYNC_STATE_KEYS.forEach((key) => localStorage.removeItem(key))
  if (hasExtensionSyncStorage()) {
    const syncedValues = Object.fromEntries(
      Object.entries(values).filter(
        ([key]) =>
          !LEGACY_SYNC_STATE_KEYS.some((stateKey) => key.startsWith(stateKey)),
      ),
    )
    await chrome.storage.sync.set(syncedValues)
  }
}
