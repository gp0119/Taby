import { ChromeTabInfo } from "@/type"

export function useChromeTabs() {
  // 2. 修改 ref 类型
  const tabs = ref<{
    [key: string]: ChromeTabInfo[]
  }>({})

  async function getTabs() {
    const res = await chrome.tabs.query({})
    // console.log("res: ", res)
    tabs.value = res.reduce((acc: { [key: string]: ChromeTabInfo[] }, cur) => {
      // 3. 创建 ChromeTabInfo 对象
      const tab: ChromeTabInfo = {
        title: cur.title || "",
        url: cur.url || "",
        description: "", // 可以留空或从其他地方获取
        windowId: cur.windowId,
        id: cur.id, // 直接使用 number | undefined
        collectionId: "", // 保持为空或根据需要设置
        order: cur.index, // 使用 tab 的 index 作为 order
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

  // 4. 调整函数参数和逻辑为 number ID
  function removeTab(tabId: number | undefined) {
    if (tabId === undefined) return
    Object.keys(tabs.value).forEach((key) => {
      tabs.value[key] = tabs.value[key].filter((item) => item.id !== tabId)
    })
    return chrome.tabs.remove(tabId) // 使用 number
  }

  function removeTabs(tabIds: number[]) {
    // 使用 number[]
    if (!tabIds || tabIds.length === 0) return
    const tabIdSet = new Set(tabIds)
    Object.keys(tabs.value).forEach((key) => {
      tabs.value[key] = tabs.value[key].filter(
        (item) => !tabIdSet.has(item.id!), // 假设 id 存在，使用 number 比较
      )
    })
    return chrome.tabs.remove(tabIds) // 使用 number[]
  }

  async function moveTab(
    tabId: number | undefined, // 使用 number | undefined
    index: number,
    windowId: number,
  ) {
    if (tabId === undefined) return
    await chrome.tabs.move(tabId, { index, windowId }) // 使用 number
    await getTabs() // 重新获取以更新 order 等信息
  }

  async function activeTab(child: ChromeTabInfo) {
    // 参数类型改为 ChromeTabInfo
    if (!child || child.id === undefined) return
    // child.windowId 已经是 number
    await chrome.windows.update(child.windowId, { focused: true })
    // 使用 child.id (number)
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

  async function closeAllTabsExceptCurrent(windowId: number) {
    // chrome.tabs.getCurrent() 不存在，应使用 query({currentWindow: true, active: true})
    const currentTabs = await chrome.tabs.query({
      currentWindow: true,
      active: true,
    })
    if (!currentTabs || currentTabs.length === 0 || !currentTabs[0].id) return
    const currentTabId = currentTabs[0].id

    const removeTabIds: number[] = []
    if (tabs.value[windowId]) {
      // 确保 windowId 存在
      tabs.value[windowId].forEach((item) => {
        // 比较 number vs number
        if (item.id !== undefined && item.id !== currentTabId) {
          removeTabIds.push(item.id) // 推入 number
        }
      })
    }
    if (removeTabIds.length > 0) {
      await chrome.tabs.remove(removeTabIds) // 使用 number[]
    }
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
  }
}
