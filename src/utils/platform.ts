export type RuntimePlatform =
  | "chrome-extension"
  | "edge-extension"
  | "firefox-extension"
  | "web"

type ExtensionApi = typeof chrome

const extensionApi =
  typeof chrome !== "undefined"
    ? chrome
    : (globalThis as typeof globalThis & { browser?: ExtensionApi }).browser

const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent
const protocol =
  typeof location === "undefined" ? "" : location.protocol.toLowerCase()

const detectRuntimePlatform = (): RuntimePlatform => {
  if (import.meta.env.MODE === "web" || !extensionApi?.runtime?.id) return "web"
  if (protocol === "moz-extension:" || userAgent.includes("Firefox/")) {
    return "firefox-extension"
  }
  if (userAgent.includes("Edg/")) return "edge-extension"
  return "chrome-extension"
}

export const runtimePlatform = detectRuntimePlatform()

export const isWeb = runtimePlatform === "web"
export const isChromeExtension = runtimePlatform === "chrome-extension"
export const isEdgeExtension = runtimePlatform === "edge-extension"
export const isFirefoxExtension = runtimePlatform === "firefox-extension"
export const isExtension = !isWeb

export const getExtensionApi = () => extensionApi

export const hasExtensionRuntime = () => !!extensionApi?.runtime?.id
export const hasExtensionStorage = () => !!extensionApi?.storage
export const hasExtensionSyncStorage = () => !!extensionApi?.storage?.sync
export const hasExtensionLocalStorage = () => !!extensionApi?.storage?.local
export const hasExtensionTabs = () => !!extensionApi?.tabs
export const hasExtensionWindows = () => !!extensionApi?.windows
export const hasExtensionTabGroups = () => !!extensionApi?.tabGroups
