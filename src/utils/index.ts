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
  } catch {
    return ""
  }
}

export function getWsrvFavicon(url: string) {
  return `https://wsrv.nl/?url=${url}&page=-1&default=1`
}

export function isNewTabPage(url: string) {
  return url === "chrome://newtab/"
}

export function getDomain(url: string) {
  if (!url) return ""
  return new URL(url)?.hostname ?? ""
}
