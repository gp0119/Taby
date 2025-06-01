import dataManager from "@/db"
import dayjs from "dayjs"
import debounce from "lodash-es/debounce"
;(async () => {
  const { hideRightClickMenu } = await chrome.storage.local.get([
    "hideRightClickMenu",
  ])
  if (!hideRightClickMenu) {
    await _updateContextMenus()
  }
})()

async function _updateContextMenus() {
  await chrome.contextMenus.removeAll()
  try {
    const spaces = await dataManager.getAllSpaceWithCollections()
    chrome.contextMenus.create({
      id: "addTabToSpaceCollection",
      title: "Add to...",
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
        type: "separator",
        id: `separator-collection-${space.id}`,
        contexts: ["all"],
      })
      chrome.contextMenus.create({
        parentId: `space-${space.id}`,
        id: `newCollection-${space.id}`,
        title: "+ New Collection",
        contexts: ["all"],
      })
    })

    chrome.contextMenus.create({
      parentId: "addTabToSpaceCollection",
      type: "separator",
      id: "separator-space",
      contexts: ["all"],
    })

    chrome.contextMenus.create({
      parentId: "addTabToSpaceCollection",
      id: "newSpace",
      title: "+ New Space",
      contexts: ["all"],
    })
  } catch (error) {
    console.error("Error updating context menus:", error)
  }
}

const updateContextMenus = debounce(_updateContextMenus, 300)

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "newSpace") {
    const newSpaceId = await dataManager.addSpace({
      title: dayjs().format("MMM DD [at] HH:mm"),
    })
    await chrome.runtime.sendMessage({
      type: "refreshCollections",
      spaceId: newSpaceId,
    })
    await updateContextMenus()
  } else if ((info.menuItemId as string).startsWith("newCollection-")) {
    const spaceId = Number((info.menuItemId as string).split("-")[1])
    await dataManager.addCollection({
      title: dayjs().format("MMM DD [at] HH:mm"),
      spaceId: spaceId,
      labelIds: [],
    })
    await chrome.runtime.sendMessage({
      type: "refreshCollections",
      spaceId: spaceId,
    })
    await updateContextMenus()
  } else if ((info.menuItemId as string).startsWith("collection-")) {
    const spaceId = (info.parentMenuItemId as string).split("-")[1]
    const collectionId = Number((info.menuItemId as string).split("-")[1])
    const { favIconUrl, title, url } = tab!
    let faviconId = null
    if (favIconUrl) {
      faviconId = await dataManager.addFavicon(favIconUrl)
    }
    await dataManager.addCard({
      title: title || "",
      url: url || "",
      collectionId: Number(collectionId),
      description: "",
      ...(faviconId && { faviconId }),
    })
    await chrome.runtime.sendMessage({
      type: "refreshCollections",
      spaceId: spaceId,
    })
  }
})

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "local" && changes.hideRightClickMenu) {
    if (changes.hideRightClickMenu.newValue) {
      await chrome.contextMenus.removeAll()
    } else {
      await updateContextMenus()
    }
  }
})

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.type === "updateContextMenus") {
    await updateContextMenus()
  }
})
