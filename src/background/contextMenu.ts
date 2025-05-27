import dataManager from "@/db"
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const spaces = await dataManager.getAllSpaceWithCollections()
    console.log("spaces: ", spaces)
    chrome.contextMenus.create({
      id: "addTabToSpaceCollection",
      title: "添加到合集",
      contexts: ["all"],
      documentUrlPatterns: ["http://*/*", "https://*/*"],
    })
    spaces.forEach((space) => {
      chrome.contextMenus.create({
        parentId: "addTabToSpaceCollection",
        id: `space-${space.id}`,
        title: space.title,
        contexts: ["all"],
      })
      space.collections.forEach((collection) => {
        chrome.contextMenus.create({
          parentId: `space-${space.id}`,
          id: `collection-${collection.id}`,
          title: collection.title,
          contexts: ["all"],
        })
      })
      chrome.contextMenus.create({
        parentId: `space-${space.id}`,
        id: `new collection`,
        title: "新建合集",
        contexts: ["all"],
      })
    })
    console.log("Context menu created.")
  } catch (error) {
    console.error("Error during onInstalled listener:", error) // 错误会在这里打印到 SW 控制台
  }
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info, tab)
})
