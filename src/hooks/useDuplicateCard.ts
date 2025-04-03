import { CollectionWithCards, Card } from "@/type"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useSpacesStore } from "@/store/spaces"
export const useDuplicateCard = () => {
  const duplicateCardStore = useDuplicateCardStore()
  const spacesStore = useSpacesStore()
  const findDuplicateCards = (collections: CollectionWithCards[]) => {
    const duplicateHash: { [key: string]: Card } = {}
    collections.forEach((collection) => {
      collection.cards.forEach((child) => {
        if (duplicateHash[child.url]) {
          if (!duplicateCardStore.duplicateCards.has(child.url)) {
            duplicateCardStore.addDuplicateCard(duplicateHash[child.url])
          }
          duplicateCardStore.addDuplicateCard(child)
        } else {
          duplicateHash[child.url] = child
        }
      })
    })
  }

  const showPrevious = () => {
    duplicateCardStore.setCurrentIndex(duplicateCardStore.currentIndex - 1)
  }

  const showNext = () => {
    duplicateCardStore.setCurrentIndex(duplicateCardStore.currentIndex + 1)
  }

  watch(
    () => duplicateCardStore.isFindDuplicate,
    () => {
      if (duplicateCardStore.isFindDuplicate) {
        findDuplicateCards(spacesStore.collections)
      } else {
        duplicateCardStore.clearDuplicateCards()
      }
    },
    { immediate: true },
  )

  return {
    findDuplicateCards,
    showPrevious,
    showNext,
  }
}

export default useDuplicateCard
