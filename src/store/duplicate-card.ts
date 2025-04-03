import { defineStore } from "pinia"
import { Card } from "@/type"
import { useDraggableStore } from "./draggable"
import { useExpandStore } from "./expand"
export const useDuplicateCardStore = defineStore("duplicateCard", {
  state: (): {
    isFindDuplicate: boolean
    duplicateCards: Map<string, Card[]>
    currentIndex: number
  } => ({
    isFindDuplicate: false,
    duplicateCards: new Map<string, Card[]>(),
    currentIndex: 0,
  }),
  getters: {
    currentDuplicateUrl: (state) => {
      if (!state.isFindDuplicate) return null
      return Array.from(state.duplicateCards.values())[state.currentIndex]?.[0]
        .url
    },
    currentDuplicateCount: (state) => {
      if (!state.isFindDuplicate) return 0
      return Array.from(state.duplicateCards.values())[state.currentIndex]
        ?.length
    },
  },
  actions: {
    setIsFindDuplicate(isFindDuplicate: boolean) {
      this.isFindDuplicate = isFindDuplicate
      if (isFindDuplicate) {
        useDraggableStore().setDraggable(false)
        useExpandStore().expandAll()
      }
    },
    addDuplicateCard(card: Card) {
      if (this.duplicateCards.has(card.url)) {
        this.duplicateCards.get(card.url)?.push(card)
      } else {
        this.duplicateCards.set(card.url, [card])
      }
    },
    clearDuplicateCards() {
      this.duplicateCards.clear()
      this.currentIndex = 0
      this.isFindDuplicate = false
    },
    setCurrentIndex(index: number) {
      if (index < 0) return
      if (index >= this.duplicateCards.size) return
      this.currentIndex = index
    },
  },
})
