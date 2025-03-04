import { useSpacesStore } from "@/store/spaces"
import { useTagsStore } from "@/store/tags.ts"

export const useRefresh = () => {
  const spacesStore = useSpacesStore()
  const tagsStore = useTagsStore()

  const refreshSpaces = async () => {
    await spacesStore.fetchSpaces()
  }

  const refreshCollections = async () => {
    const collections = await spacesStore.fetchCollections(spacesStore.activeId)
    spacesStore.setCollections(collections)
    await tagsStore.fetchCollectionsTags()
  }

  return {
    refreshSpaces,
    refreshCollections,
  }
}
