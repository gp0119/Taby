import { useSpacesStore } from "@/store/spaces"
import { useTagsStore } from "@/store/tags.ts"
import { debounce } from "lodash-es"

export const useRefresh = () => {
  const spacesStore = useSpacesStore()
  const tagsStore = useTagsStore()

  const refreshSpaces = async () => {
    await spacesStore.fetchSpaces()
    await sendRefreshCollections()
  }

  const refreshCollections = async (activeId?: number) => {
    await spacesStore.fetchCollections(activeId || spacesStore.activeId)
    await refreshTags()
    await sendRefreshCollections()
  }

  const refreshTags = async () => {
    await tagsStore.fetchCollectionsTags()
  }

  const sendRefreshCollections = debounce(async () => {
    await chrome.runtime.sendMessage({
      type: "updateContextMenus",
    })
  }, 1000)

  return {
    refreshSpaces,
    refreshCollections,
    refreshTags,
  }
}
