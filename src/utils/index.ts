export function getFaviconFromCache(u: string) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"))
  url.searchParams.set("pageUrl", u)
  url.searchParams.set("size", "32")
  return url.toString()
}

export function getGoogleFavicon(u: string) {
  const domain = new URL(u).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

export function isNewTabPage(url: string) {
  console.log("url: ", url)
  return url === "chrome://newtab/"
}
