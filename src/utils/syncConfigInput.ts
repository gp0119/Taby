import { SYNC_GIST_ID, SYNC_GIST_TOKEN, SYNC_TYPE } from "@/utils/constants"

const syncTypes = new Set(["github", "gitee", "webdav"])

export function getSyncTypeFromGistUrl(value: string) {
  try {
    const host = new URL(value.trim()).hostname
    if (host.endsWith("gitee.com")) return "gitee"
    if (host.endsWith("github.com")) return "github"
  } catch {
    return ""
  }
  return ""
}

export function normalizeGistId(value: string) {
  const input = value.trim()
  if (!input) return ""

  try {
    const url = new URL(input)
    const segments = url.pathname.split("/").filter(Boolean)
    return (segments.at(-1) || input).replace(/\.git$/, "")
  } catch {
    return input
  }
}

export function applySyncConfigFromUrl() {
  if (typeof location === "undefined") return false

  const url = new URL(location.href)
  let changed = false

  const gistInput = url.searchParams.get("gistId") || ""
  const syncType =
    url.searchParams.get("syncType") || getSyncTypeFromGistUrl(gistInput)
  if (syncTypes.has(syncType)) {
    localStorage.setItem(SYNC_TYPE, syncType)
    changed = true
  }

  const gistId = normalizeGistId(gistInput)
  if (gistId) {
    localStorage.setItem(SYNC_GIST_ID, gistId)
    changed = true
  }

  const accessToken = url.searchParams.get("accessToken") || ""
  if (accessToken) {
    localStorage.setItem(SYNC_GIST_TOKEN, accessToken)
    changed = true
  }

  return changed
}
