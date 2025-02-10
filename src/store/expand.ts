import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"

export const useExpandStore = defineStore("expand", () => {
  const expandedCollections = useLocalStorage<{
    [key: string]: boolean
  }>("expanded-collections", {})

  const toggleExpand = (collectionId: number) => {
    if (expandedCollections.value[collectionId] === undefined) {
      expandedCollections.value[collectionId] = false
      return
    }
    expandedCollections.value[collectionId] =
      !expandedCollections.value[collectionId]
  }

  const getExpandState = (collectionId: number) => {
    return expandedCollections.value[collectionId] ?? true
  }

  return {
    expandedCollections,
    toggleExpand,
    getExpandState,
  }
})
