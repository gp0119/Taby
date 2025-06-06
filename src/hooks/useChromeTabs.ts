import { Card } from "@/type.ts"

export function useChromeTabs() {
  const tabs = ref<{
    [key: string]: Card[]
  }>({})

  const activeWindowId = ref<number>(0)

  async function getTabs() {
    const allTabs = await chrome.tabs.query({})
    // console.log("allTabs: ", allTabs)
    const currentWindowTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    activeWindowId.value = currentWindowTabs[0].windowId!
    tabs.value = allTabs.reduce((acc: { [key: string]: Card[] }, cur) => {
      const tab: Card = {
        title: cur.title || "",
        url: cur.url || "",
        description: "",
        windowId: cur.windowId,
        id: cur.id!,
        collectionId: 0,
        order: 0,
        favicon: cur.favIconUrl || "",
      }
      if (acc[cur.windowId]) {
        acc[cur.windowId].push(tab)
      } else {
        acc[cur.windowId] = [tab]
      }
      return acc
    }, {})
    // console.log("tabs.value: ", tabs.value)
  }

  function removeTab(tabId: number | undefined) {
    if (!tabId) return
    Object.keys(tabs.value).forEach((key) => {
      tabs.value[key] = tabs.value[key].filter((item) => item.id !== tabId)
    })
    return chrome.tabs.remove(tabId)
  }

  function removeTabs(tabIds: number[]) {
    Object.keys(tabs.value).forEach((key) => {
      tabs.value[key] = tabs.value[key].filter(
        (item) => !tabIds.includes(item.id),
      )
    })
    return chrome.tabs.remove(tabIds)
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
    return Promise.all(urls.map((url) => chrome.tabs.create({ url })))
  }

  async function closeAllTabsExceptCurrent(windowId: number) {
    const currentTab = await chrome.tabs.getCurrent()
    if (!currentTab) return
    const removeTabIds: number[] = []
    tabs.value[windowId].forEach((item) => {
      if (item.id !== currentTab.id) {
        removeTabIds.push(item.id)
      }
    })
    await chrome.tabs.remove(removeTabIds)
  }

  function updateActiveWindowId(windowId: number) {
    activeWindowId.value = windowId
  }

  async function groupTabs(tabsIds: number[], title: string) {
    const groupId = await chrome.tabs.group({ tabIds: tabsIds })
    const colors = [
      "grey",
      "blue",
      "red",
      "yellow",
      "green",
      "pink",
      "purple",
      "cyan",
      "orange",
    ] as const
    await chrome.tabGroups.update(groupId, {
      title: title,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
    return groupId
  }

  return {
    tabs,
    getTabs,
    removeTab,
    moveTab,
    activeTab,
    openTab,
    openTabs,
    removeTabs,
    closeAllTabsExceptCurrent,
    activeWindowId,
    updateActiveWindowId,
    groupTabs,
  }
}
