import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import { liveQuery } from "dexie"
import type { CollectionWithCards, Space } from "@/type"
import dataManager from "@/db"
import { DRAFT_COLLECTION_ID } from "@/utils/constants"

type LiveQuerySubscription = {
  unsubscribe: () => void
}

type DraftCollection = {
  item: CollectionWithCards
  anchorId?: number
  side: "before" | "after"
  savedId?: number
}

export const useSpacesStore = defineStore("spaces", () => {
  const spaces = ref<Space[]>([])
  const activeId = useLocalStorage<number>("activeSpaceId", 1)

  const collections = ref<CollectionWithCards[]>([])
  const editingCollectionId = ref<number>()
  const draftCollection = ref<DraftCollection>()
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
          dropSavedDraft()
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

  function startDraftCollection(
    title: string,
    anchorId?: number,
    side: DraftCollection["side"] = "before",
  ) {
    draftCollection.value = {
      item: {
        id: DRAFT_COLLECTION_ID,
        title,
        spaceId: activeId.value,
        order: 0,
        labelIds: [],
        cards: [],
        labels: [],
      },
      anchorId,
      side,
    }
    editingCollectionId.value = DRAFT_COLLECTION_ID
  }

  function stopEditingCollection() {
    editingCollectionId.value = undefined
    draftCollection.value = undefined
  }

  // 草稿要和新 collection 在同一次更新里替换，否则虚拟列表会为保持可视位置把新 collection 挤出视口
  function dropSavedDraft() {
    const savedId = draftCollection.value?.savedId
    if (
      savedId !== undefined &&
      collections.value.some((c) => c.id === savedId)
    ) {
      draftCollection.value = undefined
    }
  }

  async function saveDraftCollection(title: string) {
    const draft = draftCollection.value!
    draft.item.title = title
    const collection = { title, spaceId: draft.item.spaceId, labelIds: [] }
    draft.savedId =
      draft.anchorId === undefined
        ? await dataManager.addCollection(collection, "HEAD")
        : await dataManager.addCollectionBeside(
            collection,
            draft.anchorId,
            draft.side,
          )
    if (draftCollection.value === draft) {
      editingCollectionId.value = undefined
      dropSavedDraft()
    }
  }

  subscribeSpaces()
  watch(
    activeId,
    (id) => {
      stopEditingCollection()
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
    editingCollectionId,
    draftCollection,
    startDraftCollection,
    stopEditingCollection,
    saveDraftCollection,
    activeId,

    currentSpace,
    fetchSpaces,
    fetchCollections,
    setActiveSpace,
  }
})
