import { ref } from "vue"
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

  async function openTabs(
    urls: string[],
    opts: { windowId?: number; background?: boolean } = {},
  ) {
    const { windowId, background = false } = opts
    const result: chrome.tabs.Tab[] = []
    for (let i = 0; i < urls.length; i++) {
      const tab = await chrome.tabs.create({
        url: urls[i],
        windowId,
        active: background ? false : i === 0, // 仅第一张前台，其他后台
      })
      result.push(tab)
    }
    return result
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

  const GROUP_COLORS = [
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

  function randomColor() {
    return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)]
  }

  async function groupTabs(tabIds: number[], title: string, windowId?: number) {
    if (tabIds.length === 0) return
    const groupId = await chrome.tabs.group(
      windowId
        ? {
            tabIds: tabIds as [number, ...number[]],
            createProperties: { windowId },
          }
        : { tabIds: tabIds as [number, ...number[]] },
    )

    await chrome.tabGroups.update(groupId, {
      title,
      color: randomColor(),
    })

    return groupId
  }

  async function openInNewWindow(urls: string[]) {
    const first = urls[0]
    const win = await chrome.windows.create({ url: first, focused: true })
    if (!win) return []
    const created: chrome.tabs.Tab[] = []

    // windows.create 可能已返回首个 tab
    if (win.tabs && win.tabs[0]) created.push(win.tabs[0])

    // 其余 URL 加到同一窗口中，后台创建即可
    for (let i = 1; i < urls.length; i++) {
      const tab = await chrome.tabs.create({
        url: urls[i],
        windowId: win.id,
        active: false,
      })
      created.push(tab)
    }
    return created
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
    openInNewWindow,
  }
}
