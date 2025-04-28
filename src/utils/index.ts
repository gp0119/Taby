import pako from "pako"

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

export function compressWithPako(data: string): string {
  const uint8Array = pako.deflate(data)
  // 将 Uint8Array 转换为二进制字符串
  let binaryString = ""
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i])
  }
  // 使用 btoa进行 Base64 编码
  return btoa(binaryString)
}

export function decompressWithPako(base64Data: string): string {
  // 使用 atob 进行 Base64 解码
  const binaryString = atob(base64Data)
  const len = binaryString.length
  const uint8Array = new Uint8Array(len)
  // 将二进制字符串转换为 Uint8Array
  for (let i = 0; i < len; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }
  // 使用 pako 解压缩
  const originalData = pako.inflate(uint8Array, { to: "string" })
  return originalData
}
