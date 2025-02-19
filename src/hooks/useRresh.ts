import { useSpacesStore } from "@/store/spaces"

export const useRefresh = () => {
  const spacesStore = useSpacesStore()

  const refreshSpaces = async () => {
    await spacesStore.fetchSpaces()
  }

  const refreshCollections = async () => {
    await spacesStore.fetchCollections(spacesStore.activeId)
  }

  return {
    refreshSpaces,
    refreshCollections,
  }
}
