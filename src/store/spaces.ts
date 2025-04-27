import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import type { CollectionWithCards, Space } from "@/type"
import dataManager from "@/db"

export const useSpacesStore = defineStore("spaces", () => {
  const spaces = ref<Space[]>([])
  const collections = ref<CollectionWithCards[]>([])
  const activeId = useLocalStorage<string>("activeSpaceId", "")

  const currentSpace = computed(() =>
    spaces.value.find((space) => space.id === activeId.value),
  )

  async function fetchSpaces() {
    try {
      const allSpaces = await dataManager.getAllSpaces()
      spaces.value = allSpaces
      if (
        allSpaces.length > 0 &&
        (!activeId.value ||
          !allSpaces.find((space) => space.id === activeId.value))
      ) {
        await setActiveSpace(allSpaces[0].id!)
      }
      return allSpaces
    } catch (error) {
      console.error("Failed to fetch spaces:", error)
      return []
    }
  }

  async function fetchCollections(spaceId: string) {
    try {
      const collections = await dataManager.getCollectionWithCards(spaceId)
      return collections
    } catch (error) {
      console.error(`Failed to fetch collections for space ${spaceId}:`, error)
      return []
    }
  }

  async function setActiveSpace(id: string) {
    activeId.value = id
  }

  function setCollections(_collections: CollectionWithCards[]) {
    collections.value = _collections
  }

  return {
    spaces,
    collections,
    activeId,

    currentSpace,
    fetchSpaces,
    fetchCollections,
    setActiveSpace,
    setCollections,
  }
})
