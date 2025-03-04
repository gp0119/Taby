import { isUndef } from "@/utils/is.ts"
import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import { Collection } from "@/type"
import DataManager from "@/db"

export const useExpandStore = defineStore("expand", () => {
  const dataManager = new DataManager()
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
    expandedCollections.value = {}
  }

  const collapseAll = async () => {
    const collections: Collection[] = await dataManager.getAllCollections()
    expandedCollections.value = collections.reduce(
      (acc: { [key: number]: boolean }, item) => {
        acc[item.id] = false
        return acc
      },
      {},
    )
  }

  return {
    expandedCollections,
    toggleCollection,
    isCollectionExpanded,
    expandAll,
    collapseAll,
  }
})
