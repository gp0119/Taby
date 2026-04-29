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

export async function getDirtyToken(): Promise<DirtyToken | null> {
  const result = await chrome.storage.local.get(DIRTY_KEY)
  const v = result[DIRTY_KEY]
  return typeof v === "number" ? v : null
}

export async function markDirtyAsync(): Promise<DirtyToken> {
  const cur = (await getDirtyToken()) ?? 0
  const next = Math.max(cur + 1, Date.now())
  await chrome.storage.local.set({ [DIRTY_KEY]: next })
  return next
}

// 仅当当前 token 与传入 token 相同时才清除，避免上传过程中的新 modify 被误清
export async function clearDirtyIfUnchanged(token: DirtyToken): Promise<void> {
  const cur = await getDirtyToken()
  if (cur === token) {
    await chrome.storage.local.remove(DIRTY_KEY)
  }
}

export async function clearDirty(): Promise<void> {
  await chrome.storage.local.remove(DIRTY_KEY)
}

// 监听 dirty token 在 chrome.storage.local 中的变化（其它 context 写入时通知本 context）
export function onDirtyChanged(
  cb: (newToken: DirtyToken | null, oldToken: DirtyToken | null) => void,
): () => void {
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
