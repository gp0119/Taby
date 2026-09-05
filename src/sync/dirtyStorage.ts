import { hasExtensionLocalStorage } from "@/utils/platform"
import Dexie from "dexie"
import { db } from "@/db/database"

// SW（背景脚本）与 SPA（前台页面）共享的"未上传修改"标记存储。
//
// 为什么不用 localStorage：localStorage 只在 page context 可用，SW（MV3 service worker）
// 没有。所以右键菜单触发的修改不能写到 localStorage，会导致后台改动不会触发同步。
// 改用 chrome.storage.local（扩展全局共享，SW 和 SPA 都可读写）。
//
// dirty token 是单调递增的数值（基于 Date.now()，同毫秒 +1），用于上传时的快照对比，
// 避免上传期间出现的新 modify 被误清。

const DIRTY_KEY = "syncDirty"

export type DirtyToken = number

const getLocalDirtyToken = () => {
  const value = localStorage.getItem(DIRTY_KEY)
  const token = value ? Number(value) : NaN
  return Number.isFinite(token) ? token : null
}

export async function getDirtyToken(): Promise<DirtyToken | null> {
  if (!hasExtensionLocalStorage()) {
    return getLocalDirtyToken()
  }
  const result = await chrome.storage.local.get(DIRTY_KEY)
  const v = result[DIRTY_KEY]
  return typeof v === "number" ? v : null
}

function withDirtyLock<T>(action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("taby-sync-dirty", action)
  }
  // HTTP Web 没有 Web Locks；复用 IDB 写事务实现跨页面互斥。
  return Dexie.ignoreTransaction(() =>
    db.transaction("rw", db.spaces, async () => {
      await db.spaces.count()
      return Dexie.waitFor(action())
    }),
  )
}

export function markDirtyAsync(): Promise<DirtyToken> {
  return withDirtyLock(async () => {
    const cur = (await getDirtyToken()) ?? 0
    const next = Math.max(cur + 1, Date.now())
    if (!hasExtensionLocalStorage()) {
      localStorage.setItem(DIRTY_KEY, String(next))
    } else {
      await chrome.storage.local.set({ [DIRTY_KEY]: next })
    }
    return next
  })
}

async function removeDirty() {
  if (!hasExtensionLocalStorage()) {
    localStorage.removeItem(DIRTY_KEY)
  } else {
    await chrome.storage.local.remove(DIRTY_KEY)
  }
}

export function clearDirtyIfUnchanged(token: DirtyToken | null): Promise<void> {
  return withDirtyLock(async () => {
    if ((await getDirtyToken()) === token) await removeDirty()
  })
}

export function clearDirty(): Promise<void> {
  return withDirtyLock(removeDirty)
}

// 监听 dirty token 在 chrome.storage.local 中的变化（其它 context 写入时通知本 context）
export function onDirtyChanged(
  cb: (newToken: DirtyToken | null, oldToken: DirtyToken | null) => void,
): () => void {
  if (!hasExtensionLocalStorage()) {
    const listener = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== DIRTY_KEY) return
      cb(getLocalDirtyToken(), event.oldValue ? Number(event.oldValue) : null)
    }
    window.addEventListener("storage", listener)
    return () => window.removeEventListener("storage", listener)
  }
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ) => {
    if (area !== "local") return
    if (!(DIRTY_KEY in changes)) return
    const change = changes[DIRTY_KEY]
    const newVal = typeof change.newValue === "number" ? change.newValue : null
    const oldVal = typeof change.oldValue === "number" ? change.oldValue : null
    cb(newVal, oldVal)
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

export const DIRTY_STORAGE_KEY = DIRTY_KEY
