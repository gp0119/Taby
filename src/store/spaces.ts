import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import { liveQuery } from "dexie"
import type { CollectionWithCards, Space } from "@/type"
import dataManager from "@/db"

type LiveQuerySubscription = {
  unsubscribe: () => void
}

export const useSpacesStore = defineStore("spaces", () => {
  const spaces = ref<Space[]>([])
  const activeId = useLocalStorage<number>("activeSpaceId", 1)

  const collections = ref<CollectionWithCards[]>([])
  let spacesSubscription: LiveQuerySubscription | undefined
  let collectionsSubscription: LiveQuerySubscription | undefined

  const currentSpace = computed(() =>
    spaces.value.find((space) => space.id === activeId.value),
  )

  function syncActiveSpace(allSpaces: Space[]) {
    if (allSpaces.length === 0) {
      collections.value = []
      return
    }
    if (
      !activeId.value ||
      allSpaces.findIndex((space) => space.id === activeId.value) === -1
    ) {
      activeId.value = allSpaces[0].id!
    }
  }

  function subscribeSpaces() {
    spacesSubscription?.unsubscribe()
    spacesSubscription = liveQuery(() => dataManager.getAllSpaces()).subscribe({
      next: (allSpaces) => {
        spaces.value = allSpaces
        syncActiveSpace(allSpaces)
      },
      error: (error) => {
        console.error("Failed to subscribe spaces:", error)
      },
    })
  }

  function subscribeCollections(spaceId: number) {
    collectionsSubscription?.unsubscribe()
    collections.value = []
    collectionsSubscription = liveQuery(() =>
      dataManager.getCollectionWithCards(spaceId),
    ).subscribe({
      next: (nextCollections) => {
        if (activeId.value === spaceId) {
          collections.value = nextCollections
        }
      },
      error: (error) => {
        console.error(
          `Failed to subscribe collections for space ${spaceId}:`,
          error,
        )
      },
    })
  }

  async function fetchSpaces() {
    try {
      const allSpaces = await dataManager.getAllSpaces()
      spaces.value = allSpaces
      syncActiveSpace(allSpaces)
      return allSpaces
    } catch (error) {
      console.error("Failed to fetch spaces:", error)
      return []
    }
  }

  async function fetchCollections(spaceId: number) {
    try {
      const nextCollections = await dataManager.getCollectionWithCards(spaceId)
      if (activeId.value === spaceId) {
        collections.value = nextCollections
      }
      return nextCollections
    } catch (error) {
      console.error(`Failed to fetch collections for space ${spaceId}:`, error)
      return []
    }
  }

  async function setActiveSpace(id: number) {
    activeId.value = id
    await fetchCollections(id)
  }

  subscribeSpaces()
  watch(
    activeId,
    (id) => {
      subscribeCollections(id)
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    spacesSubscription?.unsubscribe()
    collectionsSubscription?.unsubscribe()
  })

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
