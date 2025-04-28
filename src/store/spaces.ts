import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import type { CollectionWithCards, Space } from "@/type"
import dataManager from "@/db"

export const useSpacesStore = defineStore("spaces", () => {
  const spaces = ref<Space[]>([])
  const activeId = useLocalStorage<number>("activeSpaceId", 1)

  const cacheCollections = ref<{ [key: number]: CollectionWithCards[] }>({})

  const collections = computed(() => {
    return cacheCollections.value[activeId.value] || []
  })

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
          allSpaces.findIndex((space) => space.id === activeId.value) === -1)
      ) {
        await setActiveSpace(allSpaces[0].id!)
      }
      return allSpaces
    } catch (error) {
      console.error("Failed to fetch spaces:", error)
      return []
    }
  }

  async function fetchCollections(spaceId: number) {
    try {
      const collections = await dataManager.getCollectionWithCards(spaceId)
      console.log("collections: ", collections)
      cacheCollections.value[spaceId] = collections
      return collections
    } catch (error) {
      console.error(`Failed to fetch collections for space ${spaceId}:`, error)
      return []
    }
  }

  async function setActiveSpace(id: number) {
    activeId.value = id
    if (!cacheCollections.value[id]) {
      await fetchCollections(id)
    }
  }

  return {
    spaces,
    collections,
    activeId,

    currentSpace,
    fetchSpaces,
    fetchCollections,
    setActiveSpace,
  }
})
