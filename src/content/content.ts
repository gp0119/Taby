console.log("content script loaded")
const getFavicons = async () => {
  const iconLinks = document.querySelectorAll('link[rel*="icon"]')
  const url = window.location.href
  const origin = new URL(url).origin
  const href = new URL(url).href
  const defaultGoogleFavicon = `https://www.google.com/s2/favicons?domain=${origin}&sz=32`
  if (iconLinks.length) {
    const hrefList = Array.from(iconLinks).map((link) =>
      link.getAttribute("href"),
    )
    console.log("hrefList: ", hrefList)
    let firstUrl
    const icoList = hrefList.filter((item) => item?.includes(".ico"))
    if (icoList.length) {
      firstUrl = icoList[0]
    } else {
      firstUrl = hrefList[0]
    }
    if (firstUrl) {
      if (firstUrl.startsWith("http") || firstUrl.startsWith("data:"))
        return firstUrl
      return firstUrl.startsWith("./")
        ? joinPath(href, firstUrl.slice(1))
        : firstUrl.startsWith("//")
          ? joinPath("https:", firstUrl)
          : joinPath(origin, firstUrl)
    }
  }
  try {
    const defaultFaviconUrl = `${origin}/favicon.ico`
    const response = await fetch(defaultFaviconUrl, { method: "HEAD" })
    if (response.ok) {
      return defaultFaviconUrl
    }
  } catch (error) {
    console.log("Error checking favicon.ico:", error)
  }

  return defaultGoogleFavicon
}

function joinPath(...segments: string[]) {
  const parts: string[] = segments.reduce(
    (parts: string[], segment: string) => {
      if (parts.length > 0) {
        segment = segment.replace(/^\//, "")
      }
      segment = segment.replace(/\/$/, "")
      return parts.concat(segment.split("/"))
    },
    [],
  )
  const resultParts: string[] = []
  for (const part of parts) {
    if (part === ".") {
      continue
    }
    if (part === "..") {
      resultParts.pop()
      continue
    }
    resultParts.push(part)
  }
  return resultParts.join("/")
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "getFavicons") {
    getFavicons()
      .then((res) => {
        sendResponse(res)
      })
      .catch((error) => {
        sendResponse({ error: error.message })
      })
    return true
  }
  return false
})
