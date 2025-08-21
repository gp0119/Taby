import { useSpacesStore } from "@/store/spaces"

export const useRefresh = () => {
  const spacesStore = useSpacesStore()

  const refreshSpaces = async () => {
    await spacesStore.fetchSpaces()
  }

  const refreshCollections = async (activeId?: number) => {
    await spacesStore.fetchCollections(activeId || spacesStore.activeId)
  }

  const updateContextMenus = async () => {
    await chrome.runtime.sendMessage({
      type: "updateContextMenus",
    })
  }

  return {
    refreshSpaces,
    refreshCollections,
    updateContextMenus,
  }
}
