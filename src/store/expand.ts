import { isUndef } from "@/utils/is.ts"
import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import { useSpacesStore } from "./spaces"

export const useExpandStore = defineStore("expand", () => {
  const spacesStore = useSpacesStore()
  const expandedCollections = useLocalStorage<{
    [key: number]: boolean
  }>("expanded-collections", {})

  const toggleCollection = (collectionId: number) => {
    if (isUndef(expandedCollections.value[collectionId])) {
      expandedCollections.value[collectionId] = false
    } else {
      expandedCollections.value[collectionId] =
        !expandedCollections.value[collectionId]
    }
  }

  const isCollectionExpanded = (collectionId: number) => {
    return isUndef(expandedCollections.value[collectionId])
      ? true
      : expandedCollections.value[collectionId]
  }

  const expandAll = () => {
    spacesStore.collections.forEach((collection) => {
      if (!isUndef(expandedCollections.value[collection.id])) {
        delete expandedCollections.value[collection.id]
      }
    })
  }

  const collapseAll = async () => {
    expandedCollections.value = spacesStore.collections.reduce(
      (acc: { [key: number]: boolean }, item) => {
        acc[item.id] = false
        return acc
      },
      { ...expandedCollections.value },
    )
  }

  const isCollapseAll = computed(() => {
    const expandedCollectionsLength = Object.keys(
      expandedCollections.value,
    ).length
    if (expandedCollectionsLength === 0) {
      return true
    } else {
      if (
        spacesStore.collections.every((collection) => {
          return expandedCollections.value[collection.id] === false
        })
      ) {
        return false
      } else {
        return true
      }
    }
  })

  return {
    expandedCollections,
    toggleCollection,
    isCollectionExpanded,
    expandAll,
    collapseAll,
    isCollapseAll,
  }
})
