import { CollectionWithCards } from "@/type"
import { useDuplicateCardStore } from "@/store/duplicate-card"

export const useDuplicateCard = () => {
  const duplicateCardStore = useDuplicateCardStore()

  const findDuplicateCards = (collections: CollectionWithCards[]) => {
    const duplicateHash: { [key: string]: boolean } = {}
    collections.forEach((collection) => {
      collection.cards.forEach((child) => {
        if (duplicateHash[child.url]) {
          console.log("child: ", child)
          duplicateCardStore.addDuplicateCard(child)
        } else {
          duplicateHash[child.url] = true
        }
      })
    })
    console.log(
      "duplicateCardStore.duplicateCards: ",
      duplicateCardStore.duplicateCards,
    )
  }

  return {
    findDuplicateCards,
  }
}

export default useDuplicateCard
