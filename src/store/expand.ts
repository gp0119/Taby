import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import { Collection } from "@/type"
import DataManager from "@/db"

export const useExpandStore = defineStore("expand", () => {
  const dataManager = new DataManager()
  const expandedCollections = useLocalStorage<number[]>(
    "expanded-collections",
    [],
  )

  const toggleCollection = (collectionId: number) => {
    const index = expandedCollections.value.indexOf(collectionId)
    if (index === -1) {
      expandedCollections.value.push(collectionId)
    } else {
      expandedCollections.value.splice(index, 1)
    }
  }

  const isCollectionExpanded = (collectionId: number) => {
    return expandedCollections.value.includes(collectionId)
  }

  const expandAll = async () => {
    const collections: Collection[] = await dataManager.getAllCollections()
    expandedCollections.value = collections.map((item) => item.id)
  }

  const collapseAll = () => {
    expandedCollections.value = []
  }

  const initExpandedCollections = async () => {
    if (expandedCollections.value.length === 0) {
      const collections: Collection[] = await dataManager.getAllCollections()
      expandedCollections.value = collections.map((item) => item.id)
    }
  }

  return {
    expandedCollections,
    toggleCollection,
    isCollectionExpanded,
    expandAll,
    collapseAll,
    initExpandedCollections,
  }
})
