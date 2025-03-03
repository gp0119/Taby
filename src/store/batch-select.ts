import { defineStore } from "pinia"

export const useBatchSelectStore = defineStore("batch-select", () => {
  const selectedCardIds = ref<number[]>([])

  const addSelectedCardId = (id: number) => {
    selectedCardIds.value.push(id)
  }

  const removeSelectedCardId = (id: number) => {
    selectedCardIds.value = selectedCardIds.value.filter((item) => item !== id)
  }

  const clearSelectedCardIds = () => {
    selectedCardIds.value = []
  }

  return {
    selectedCardIds,
    addSelectedCardId,
    removeSelectedCardId,
    clearSelectedCardIds,
  }
})
