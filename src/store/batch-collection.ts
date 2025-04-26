import { defineStore } from "pinia"

export const useBatchCollectionStore = defineStore("batch-collection", () => {
  const selectedCollectionIds = ref<string[]>([])

  const addSelectedCollectionId = (id: string) => {
    selectedCollectionIds.value.push(id)
  }

  const removeSelectedCollectionId = (id: string) => {
    selectedCollectionIds.value = selectedCollectionIds.value.filter(
      (item) => item !== id,
    )
  }

  const clearSelectedCollectionIds = () => {
    selectedCollectionIds.value = []
  }

  return {
    selectedCollectionIds,
    addSelectedCollectionId,
    removeSelectedCollectionId,
    clearSelectedCollectionIds,
  }
})
