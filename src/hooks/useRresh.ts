import { useSpacesStore } from "@/store/spaces"
import { useTagsStore } from "@/store/tags.ts"

export const useRefresh = () => {
  const spacesStore = useSpacesStore()
  const tagsStore = useTagsStore()

  const refreshSpaces = async () => {
    await spacesStore.fetchSpaces()
  }

  const refreshCollections = async (activeId?: number) => {
    await spacesStore.fetchCollections(activeId || spacesStore.activeId)
    await refreshTags()
  }

  const refreshTags = async () => {
    await tagsStore.fetchCollectionsTags()
  }

  const updateContextMenus = async () => {
    await chrome.runtime.sendMessage({
      type: "updateContextMenus",
    })
  }

  return {
    refreshSpaces,
    refreshCollections,
    refreshTags,
    updateContextMenus,
  }
}
