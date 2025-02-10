export function faviconURL(url: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`
}

export function isNewTabPage(url: string) {
  return url === "chrome://newtab/"
}
