import { isNewTabPage } from "@/utils"
import { Card } from "@/type.ts"

export function useChromeTabs() {
  const tabs = ref<{
    [key: string]: Card[]
  }>({})

  async function getTabs() {
    const res = await chrome.tabs.query({})
    tabs.value = res
      .filter((item) => !isNewTabPage(item.url as string))
      .reduce((acc: { [key: string]: Card[] }, cur) => {
        if (acc[cur.windowId]) {
          acc[cur.windowId].push({
            title: cur.title || "",
            url: cur.url || "",
            customTitle: "",
            customDescription: "",
            windowId: cur.windowId,
            id: cur.id as number,
            collectionId: 0,
            order: 0,
          })
        } else {
          acc[cur.windowId] = [
            {
              title: cur.title || "",
              url: cur.url || "",
              customTitle: "",
              customDescription: "",
              windowId: cur.windowId,
              id: cur.id as number,
              collectionId: 0,
              order: 0,
            },
          ]
        }
        console.log("acc: ", acc)
        return acc
      }, {})
  }

  function removeTab(tabId: number | undefined) {
    if (!tabId) return
    Object.keys(tabs.value).forEach((key) => {
      tabs.value[key] = tabs.value[key].filter((item) => item.id !== tabId)
    })
    return chrome.tabs.remove(tabId)
  }

  async function moveTab(
    tabId: number | undefined,
    index: number,
    windowId: number,
  ) {
    if (!tabId) return
    await chrome.tabs.move(tabId, { index, windowId })
    await getTabs()
  }

  async function activeTab(child: Card) {
    if (!child) return
    await chrome.windows.update(child.windowId!, { focused: true })
    return chrome.tabs.update(child.id, { active: true })
  }

  async function openTab(url: string) {
    return chrome.tabs.create({ url: url })
  }

  async function openTabs(urls: string[]) {
    urls.forEach((url) => {
      chrome.tabs.create({ url })
    })
  }

  return {
    tabs,
    getTabs,
    removeTab,
    moveTab,
    activeTab,
    openTab,
    openTabs,
  }
}
