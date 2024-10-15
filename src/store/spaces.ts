import { defineStore } from "pinia"
import { iCard, iCollection, iSpace } from "@/type.ts"
import { useLocalStorage } from "@vueuse/core"

export const useSpacesStore = defineStore("spaces", () => {
  const mySpaces = useLocalStorage<iSpace[]>("mySpaces", [
    {
      title: "my collection",
      spaces: [],
    },
  ])

  const activeSpaceIndex = useLocalStorage<number>("activeSpaceIndex", 0)

  const getCollections = computed(
    () => mySpaces.value[activeSpaceIndex.value].spaces,
  )
  const getActiveSpace = computed(() => mySpaces.value[activeSpaceIndex.value])

  function updateActiveSpaceIndex(index: number) {
    activeSpaceIndex.value = index
  }

  // space  ---------------------
  function addSpace(space: iSpace) {
    mySpaces.value.push(space)
  }

  function removeSpace(index: number) {
    mySpaces.value.splice(index, 1)
  }

  function moveSpace(fromIndex: number, toIndex: number) {
    const space = mySpaces.value[fromIndex]
    mySpaces.value.splice(fromIndex, 1)
    mySpaces.value.splice(toIndex, 0, space)
  }

  function updateSpace(index: number, space: iSpace) {
    mySpaces.value[index] = space
  }

  // collection ---------------------
  function addCollection(collection: iCollection) {
    mySpaces.value[activeSpaceIndex.value].spaces.push(collection)
  }

  function removeCollection(index: number) {
    mySpaces.value[activeSpaceIndex.value].spaces.splice(index, 1)
  }

  function moveCollection(fromIndex: number, toIndex: number) {
    const collection = mySpaces.value[activeSpaceIndex.value].spaces[fromIndex]
    mySpaces.value[activeSpaceIndex.value].spaces.splice(fromIndex, 1)
    mySpaces.value[activeSpaceIndex.value].spaces.splice(toIndex, 0, collection)
  }

  function updateCollection(index: number, collection: iCollection) {
    mySpaces.value[activeSpaceIndex.value].spaces[index] = collection
  }

  function moveCollectionToSpace(fromIndex: number, toIndex: number) {
    const collection = mySpaces.value[activeSpaceIndex.value].spaces[fromIndex]
    mySpaces.value[activeSpaceIndex.value].spaces.splice(fromIndex, 1)
    mySpaces.value[toIndex].spaces.unshift(collection)
  }

  // card ---------------------
  function addCard(index: number, card: iCard) {
    mySpaces.value[activeSpaceIndex.value].spaces[index].cards.push(card)
  }

  function removeCard(collectionIndex: number, cardIndex: number) {
    mySpaces.value[activeSpaceIndex.value].spaces[collectionIndex].cards.splice(
      cardIndex,
      1,
    )
  }

  function updateCard(collectionIndex: number, cardIndex: number, card: iCard) {
    mySpaces.value[activeSpaceIndex.value].spaces[collectionIndex].cards[
      cardIndex
    ] = card
  }

  function moveCard(
    fromCollectionIndex: number,
    fromCardIndex: number,
    toCollectionIndex: number,
    toCardIndex: number,
  ) {
    const card =
      mySpaces.value[activeSpaceIndex.value].spaces[fromCollectionIndex].cards[
        fromCardIndex
      ]
    mySpaces.value[activeSpaceIndex.value].spaces[
      fromCollectionIndex
    ].cards.splice(fromCardIndex, 1)
    mySpaces.value[activeSpaceIndex.value].spaces[
      toCollectionIndex
    ].cards.splice(toCardIndex, 0, card)
  }

  function moveCardToCollection(
    fromCollectionIndex: number,
    fromCardIndex: number,
    toCollectionIndex: number,
  ) {
    const card =
      mySpaces.value[activeSpaceIndex.value].spaces[fromCollectionIndex].cards[
        fromCardIndex
      ]
    mySpaces.value[activeSpaceIndex.value].spaces[
      fromCollectionIndex
    ].cards.splice(fromCardIndex, 1)
    mySpaces.value[activeSpaceIndex.value].spaces[toCollectionIndex].cards.push(
      card,
    )
  }

  return {
    mySpaces,
    getActiveSpace,
    activeSpaceIndex,
    getCollections,
    updateActiveSpaceIndex,
    addSpace,
    moveSpace,
    removeSpace,
    updateSpace,
    addCollection,
    removeCollection,
    moveCollection,
    updateCollection,
    moveCollectionToSpace,
    addCard,
    removeCard,
    updateCard,
    moveCard,
    moveCardToCollection,
  }
})
