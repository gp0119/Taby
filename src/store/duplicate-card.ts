import { defineStore } from "pinia"
import { Card } from "@/type"
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
  },
  actions: {
    setIsFindDuplicate(isFindDuplicate: boolean) {
      this.isFindDuplicate = isFindDuplicate
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
    },
    setCurrentIndex(index: number) {
      if (index < 0) return
      if (index >= this.duplicateCards.size) return
      this.currentIndex = index
    },
  },
})
