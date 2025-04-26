import { defineStore } from "pinia"

export const useBatchCardStore = defineStore("batch-card", () => {
  const selectedCardIds = ref<string[]>([])

  const addSelectedCardId = (id: string) => {
    selectedCardIds.value.push(id)
  }

  const removeSelectedCardId = (id: string) => {
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
