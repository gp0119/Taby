import { defineStore } from "pinia"
import tabbyDatabaseService, { CollectionWithCards, Space } from "@/db"
import { useLocalStorage } from "@vueuse/core"

export const useSpacesStore = defineStore("spaces", () => {
  const allSpaces = ref<Space[]>([])

  const currentCollections = ref<CollectionWithCards[] | null>(null)

  const activeSpaceId = useLocalStorage("activeSpaceId", 0)

  function setActiveSpaceId(id: number) {
    activeSpaceId.value = id
  }

  function setAllSpaces(spaces: Space[]) {
    allSpaces.value = spaces
  }

  function setCurrentCollections(space: CollectionWithCards[]) {
    currentCollections.value = space
  }

  async function getCollectionsById(collectionId: number) {
    const collectionsToSet =
      await tabbyDatabaseService.getCollectionWithCards(collectionId)
    setCurrentCollections(collectionsToSet)
  }

  return {
    allSpaces,
    activeSpaceId,
    currentCollections,
    setCurrentCollections,
    setAllSpaces,
    setActiveSpaceId,
    getCollectionsById,
  }
})
