import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import type { CollectionWithCards, Space } from "@/type"
import dataManager from "@/db"

export const useSpacesStore = defineStore("spaces", () => {
  const spaces = ref<Space[]>([])
  const collections = ref<CollectionWithCards[]>([])
  const activeId = useLocalStorage<number>("activeSpaceId", 1)

  const currentSpace = computed(() =>
    spaces.value.find((space) => space.id === activeId.value),
  )

  async function fetchSpaces() {
    try {
      const allSpaces = await dataManager.getAllSpaces()
      spaces.value = allSpaces
      return allSpaces
    } catch (error) {
      console.error("Failed to fetch spaces:", error)
      return []
    }
  }

  async function fetchCollections(spaceId: number) {
    try {
      return dataManager.getCollectionWithCards(spaceId)
    } catch (error) {
      console.error(`Failed to fetch collections for space ${spaceId}:`, error)
      return []
    }
  }

  async function setActiveSpace(id: number) {
    activeId.value = id
    await fetchCollections(id)
  }

  function setCollections(_collections: CollectionWithCards[]) {
    collections.value = _collections
  }

  // 初始化方法
  async function initialize() {
    const spaces = await fetchSpaces()
    if (spaces.length > 0 && !activeId.value) {
      await setActiveSpace(spaces[0].id!)
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
    initialize,
    setCollections,
  }
})
