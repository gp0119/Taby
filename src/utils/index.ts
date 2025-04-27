import { nanoid } from "nanoid"

export function getFaviconFromCache(u: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"))
  url.searchParams.set("pageUrl", u)
  url.searchParams.set("size", "32")
  return url.toString()
}

export function getGoogleFavicon(url: string) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch (error) {
    return ""
  }
}

export function isNewTabPage(url: string) {
  return url === "chrome://newtab/"
}

export function uuid() {
  return nanoid(6)
}

export function uuidValidate(id: string) {
  if (typeof id !== "string") {
    return false
  }
  // 2. 检查长度是否为 6
  if (id.length !== 6) {
    return false
  }
  // 3. 检查是否只包含 nanoid 默认 URL 安全字符 (A-Z, a-z, 0-9, _, -)
  //    正则表达式: ^[A-Za-z0-9_-]{6}$
  //    ^ - 字符串开始
  //    [A-Za-z0-9_-] - 允许的字符集
  //    {6} - 必须重复 6 次
  //    $ - 字符串结束
  const nanoidRegex = /^[A-Za-z0-9_-]{6}$/
  return nanoidRegex.test(id)
}
