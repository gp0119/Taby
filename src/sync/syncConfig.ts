import {
  SYNC_BACKUP_TYPES,
  SYNC_CONFIG_VERSION,
  SYNC_GIST_ID,
  SYNC_GIST_TOKEN,
  SYNC_GITEE_GIST_ID,
  SYNC_GITEE_GIST_TOKEN,
  SYNC_GITHUB_GIST_ID,
  SYNC_GITHUB_GIST_TOKEN,
  SYNC_LAST_ETAG,
  SYNC_LAST_REMOTE_UPDATED_AT,
  SYNC_TYPE,
  SYNC_WEBDAV_FILENAME,
  SYNC_WEBDAV_FOLDER,
  SYNC_WEBDAV_HOST,
  SYNC_WEBDAV_PASSWORD,
  SYNC_WEBDAV_PORT,
  SYNC_WEBDAV_PROTOCOL,
  SYNC_WEBDAV_USERNAME,
} from "../utils/constants.ts"

export type SyncProviderType = "github" | "gitee" | "webdav"
export type GistProviderType = Exclude<SyncProviderType, "webdav">

export const SYNC_PROVIDER_TYPES = ["github", "gitee", "webdav"] as const

export interface GistConfig {
  type: GistProviderType
  accessToken: string
  gistId: string
}

type ReadableStorage = Pick<Storage, "getItem">

const GIST_CONFIG_KEYS = {
  github: {
    token: SYNC_GITHUB_GIST_TOKEN,
    id: SYNC_GITHUB_GIST_ID,
  },
  gitee: {
    token: SYNC_GITEE_GIST_TOKEN,
    id: SYNC_GITEE_GIST_ID,
  },
} as const

export const SYNC_CONFIG_STORAGE_KEYS = [
  SYNC_CONFIG_VERSION,
  SYNC_TYPE,
  SYNC_BACKUP_TYPES,
  SYNC_GIST_TOKEN,
  SYNC_GIST_ID,
  SYNC_GITHUB_GIST_TOKEN,
  SYNC_GITHUB_GIST_ID,
  SYNC_GITEE_GIST_TOKEN,
  SYNC_GITEE_GIST_ID,
  SYNC_WEBDAV_PROTOCOL,
  SYNC_WEBDAV_HOST,
  SYNC_WEBDAV_PORT,
  SYNC_WEBDAV_FOLDER,
  SYNC_WEBDAV_FILENAME,
  SYNC_WEBDAV_USERNAME,
  SYNC_WEBDAV_PASSWORD,
] as const

export const getSyncProviderType = (
  storage: ReadableStorage = localStorage,
): SyncProviderType => {
  const value = storage.getItem(SYNC_TYPE)
  return value === "gitee" || value === "webdav" ? value : "github"
}

export const getBackupProviderTypes = (
  storage: ReadableStorage = localStorage,
): SyncProviderType[] => {
  try {
    const primaryType = getSyncProviderType(storage)
    const values = JSON.parse(storage.getItem(SYNC_BACKUP_TYPES) || "[]")
    return normalizeBackupProviderTypes(values, primaryType)
  } catch {
    return []
  }
}

export const normalizeBackupProviderTypes = (
  values: unknown,
  primaryType: SyncProviderType,
): SyncProviderType[] => {
  if (!Array.isArray(values)) return []
  return SYNC_PROVIDER_TYPES.filter(
    (type) => type !== primaryType && values.includes(type),
  )
}

// 迁移到 v2 前使用的、不区分 provider 的远端状态键
export const LEGACY_SYNC_STATE_KEYS = [
  SYNC_LAST_ETAG,
  SYNC_LAST_REMOTE_UPDATED_AT,
] as const

export const getGistCapability = (config: GistConfig) => ({
  canUpload: !!config.accessToken,
  canDownload: !!(config.accessToken && config.gistId),
})

export const shouldTryBaselineBootstrap = (
  targetChanged: boolean,
  lastSeen: string,
  remoteUpdatedAt: string,
) => !targetChanged && !lastSeen && !!remoteUpdatedAt

export const getGistConfig = <T extends GistProviderType>(
  type: T,
  storage: ReadableStorage = localStorage,
): GistConfig & { type: T } => {
  const keys = GIST_CONFIG_KEYS[type]
  const useLegacyConfig =
    storage.getItem(SYNC_CONFIG_VERSION) !== "2" &&
    getSyncProviderType(storage) === type
  return {
    type,
    accessToken:
      storage.getItem(keys.token) ||
      (useLegacyConfig ? storage.getItem(SYNC_GIST_TOKEN) || "" : ""),
    gistId:
      storage.getItem(keys.id) ||
      (useLegacyConfig ? storage.getItem(SYNC_GIST_ID) || "" : ""),
  }
}

export const getGistConfigValues = (
  config: GistConfig,
  primaryType?: SyncProviderType,
) => {
  const keys = GIST_CONFIG_KEYS[config.type]
  return {
    [keys.token]: config.accessToken,
    [keys.id]: config.gistId,
    ...(primaryType === config.type
      ? {
          [SYNC_GIST_TOKEN]: config.accessToken,
          [SYNC_GIST_ID]: config.gistId,
        }
      : {}),
  }
}

export const getLegacySyncConfigMigration = (
  storage: ReadableStorage,
): Record<string, string> => {
  if (storage.getItem(SYNC_CONFIG_VERSION) === "2") return {}

  const primaryType = getSyncProviderType(storage)
  const values: Record<string, string> = {
    [SYNC_BACKUP_TYPES]: JSON.stringify(getBackupProviderTypes(storage)),
  }
  if (primaryType !== "webdav") {
    Object.assign(
      values,
      getGistConfigValues(getGistConfig(primaryType, storage), primaryType),
    )
    const stateSuffix = `:${primaryType}`
    const lastEtag = storage.getItem(SYNC_LAST_ETAG)
    const lastRemoteUpdatedAt = storage.getItem(SYNC_LAST_REMOTE_UPDATED_AT)
    if (lastEtag) values[`${SYNC_LAST_ETAG}${stateSuffix}`] = lastEtag
    if (lastRemoteUpdatedAt) {
      values[`${SYNC_LAST_REMOTE_UPDATED_AT}${stateSuffix}`] =
        lastRemoteUpdatedAt
    }
  }
  values[SYNC_CONFIG_VERSION] = "2"
  return values
}
