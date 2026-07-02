import {
  SYNC_WEBDAV_FILENAME,
  SYNC_WEBDAV_FOLDER,
  SYNC_WEBDAV_HOST,
  SYNC_WEBDAV_PORT,
  SYNC_WEBDAV_PROTOCOL,
} from "@/utils/constants.ts"
import { AuthType, createClient } from "webdav"

export type WebdavProtocol = "http" | "https"

export interface WebdavConfig {
  protocol: WebdavProtocol
  host: string
  port: string
  folder: string
  filename: string
}

export interface WebdavCredential {
  username: string
  password: string
}

const DEFAULT_FILE_NAME = "taby-sync.json"

const normalizeFolder = (value: string) => {
  return value.trim().replace(/^\/+|\/+$/g, "")
}

const normalizeFilename = (value: string) => {
  const filename = value.trim().replace(/^\/+/g, "")
  return filename || DEFAULT_FILE_NAME
}

const normalizeRootPath = (value: string) => {
  const path = value.replace(/\/+$/g, "")
  return path === "/" ? "" : path
}

export const buildWebdavLocation = (config: WebdavConfig) => {
  const host = config.host
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "")
  if (!host) return undefined

  const port = config.port.trim()
  const url = new URL(`${config.protocol}://${host}`)
  if (port) url.port = port

  const rootPath = normalizeRootPath(url.pathname)
  const folder = normalizeFolder(config.folder)
  const filename = normalizeFilename(config.filename)
  const directoryPath = folder
  const filePath = folder ? `${folder}/${filename}` : filename
  const baseUrl = `${url.protocol}//${url.host}${rootPath}`
  const displayPath = `/${filePath}`

  return {
    baseUrl,
    directoryPath,
    filePath,
    url: `${baseUrl}${displayPath}`,
  }
}

export const buildWebdavUrl = (config: WebdavConfig) => {
  return buildWebdavLocation(config)?.url || ""
}

export const buildWebdavDirectory = (config: WebdavConfig) => {
  const location = buildWebdavLocation(config)
  if (!location) return undefined
  return {
    baseUrl: location.baseUrl,
    path: "",
  }
}

export const getWebdavConfig = (): WebdavConfig => {
  const protocol = localStorage.getItem(SYNC_WEBDAV_PROTOCOL)
  return {
    protocol: protocol === "http" ? "http" : "https",
    host: localStorage.getItem(SYNC_WEBDAV_HOST) || "",
    port: localStorage.getItem(SYNC_WEBDAV_PORT) || "",
    folder: localStorage.getItem(SYNC_WEBDAV_FOLDER) || "",
    filename: localStorage.getItem(SYNC_WEBDAV_FILENAME) || DEFAULT_FILE_NAME,
  }
}

export const persistWebdavConfig = (config: WebdavConfig) => {
  const values = {
    [SYNC_WEBDAV_PROTOCOL]: config.protocol,
    [SYNC_WEBDAV_HOST]: config.host,
    [SYNC_WEBDAV_PORT]: config.port,
    [SYNC_WEBDAV_FOLDER]: config.folder,
    [SYNC_WEBDAV_FILENAME]: normalizeFilename(config.filename),
  }
  Object.entries(values).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })
  return values
}

export const hasWebdavConfig = () => {
  return !!getWebdavConfig().host.trim()
}

export const testWebdavConnection = async (
  config: WebdavConfig,
  credential: WebdavCredential,
) => {
  const directory = buildWebdavDirectory(config)
  if (!directory) {
    throw new Error("Missing WebDAV host")
  }

  const hasCredentials = !!(credential.username || credential.password)
  const client = createClient(directory.baseUrl, {
    authType: hasCredentials ? AuthType.Auto : AuthType.None,
    username: credential.username,
    password: credential.password,
  })
  const stat = await client.stat(directory.path)
  if ("data" in stat) {
    return stat.data
  }
  return stat
}
