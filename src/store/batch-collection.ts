import { defineStore } from "pinia"

export const useBatchCollectionStore = defineStore("batch-collection", () => {
  const selectedCollectionIds = ref<number[]>([])

  const addSelectedCollectionId = (id: number) => {
    selectedCollectionIds.value.push(id)
  }

  const removeSelectedCollectionId = (id: number) => {
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
