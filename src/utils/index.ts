export function faviconURL(url: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`
}

export function getFaviconFromCache(u: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"))
  url.searchParams.set("pageUrl", u)
  url.searchParams.set("size", "32")
  return url.toString()
}

export function isNewTabPage(url: string) {
  return url === "chrome://newtab/"
}
