import Dexie from "dexie"
import { isUndef } from "@/utils/is.ts"
import { Card, Collection, CollectionWithCards, Space } from "@/type.ts"
import { db } from "./database.ts"

class dataManager {
  ORDER_STEP: number
  constructor() {
    this.ORDER_STEP = 10
  }

  async getAllSpaces() {
    return db.spaces.orderBy("order").toArray()
  }

  async addSpace(space: Omit<Space, "id" | "order">) {
    const lastSpace = await db.spaces.orderBy("order").last()
    return db.spaces.add({
      ...space,
      order: lastSpace ? lastSpace.order + this.ORDER_STEP : this.ORDER_STEP,
    })
  }

  async removeSpace(id: number) {
    await db.transaction(
      "rw",
      db.spaces,
      db.collections,
      db.cards,
      async () => {
        const collectionsToDelete = await db.collections
          .where({ spaceId: id })
          .toArray()
        for (const collection of collectionsToDelete) {
          await db.cards.where({ collectionId: collection.id }).delete()
        }
        await db.collections.where({ spaceId: id }).delete()
        await db.spaces.delete(id)
      },
    )
  }

  async updateSpaceTitle(id: number, title: string) {
    return db.spaces.update(id, { title })
  }

  async moveSpace(id: number, targetId: number) {
    const allSpaces = await db.spaces.orderBy("order").toArray()
    let currentSpace, currentIndex, targetIndex
    for (const [index, space] of allSpaces.entries()) {
      if (space.id === id) {
        currentSpace = space
        currentIndex = index
      }
      if (space.id === targetId) {
        targetIndex = index
      }
    }
    if (isUndef(currentIndex) || isUndef(targetIndex)) return
    allSpaces.splice(currentIndex, 1)
    allSpaces.splice(targetIndex, 0, currentSpace!)
    await Promise.all(
      allSpaces.map(async (space, index) => {
        await db.spaces.update(space.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async addCollection(collection: Omit<Collection, "id" | "order">) {
    const lastCollection = await db.collections
      .where("[spaceId+order]")
      .between(
        [collection.spaceId, Dexie.minKey],
        [collection.spaceId, Dexie.maxKey],
      )
      .last()
    return db.collections.add({
      ...collection,
      order: lastCollection ? lastCollection.order + this.ORDER_STEP : 1000,
    })
  }

  async removeCollection(id: number) {
    await db.transaction("rw", db.collections, db.cards, async () => {
      await db.cards.where("collectionId").equals(id).delete()
      await db.collections.delete(id)
    })
  }

  async updateCollectionTitle(collectionId: number, title: string) {
    return db.collections.update(collectionId, { title })
  }

  async addTagforCollection(collectionId: number, tagId: number) {
    const collection = await db.collections.get(collectionId)
    if (!collection) return
    if (collection.labelIds.includes(tagId)) return
    return db.collections.update(collectionId, {
      labelIds: [...collection.labelIds, tagId],
    })
  }

  async removeTagforCollection(collectionId: number, tagId: number) {
    const collection = await db.collections.get(collectionId)
    if (!collection) return
    if (!collection.labelIds.includes(tagId)) return
    return db.collections.update(collectionId, {
      labelIds: collection.labelIds.filter((id) => id !== tagId),
    })
  }

  async moveCollection(collectionId: number, targetId: number) {
    const currentCollection = await db.collections.get(collectionId)
    if (!currentCollection) return
    const allCollections = await db.collections
      .where({ spaceId: currentCollection.spaceId })
      .sortBy("order")
    let targetIndex, currentIndex
    for (const [index, collection] of allCollections.entries()) {
      if (collection.id === collectionId) {
        currentIndex = index
      }
      if (collection.id === targetId) {
        targetIndex = index
      }
    }
    if (isUndef(currentIndex) || isUndef(targetIndex)) return
    allCollections.splice(currentIndex, 1)
    allCollections.splice(targetIndex, 0, currentCollection)
    await Promise.all(
      allCollections.map(async (collection, index) => {
        await db.collections.update(collection.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async moveCollectionToSpace(collectionId: number, targetSpaceId: number) {
    const currentCollection = await db.collections.get(collectionId)
    if (!currentCollection) return
    const lastCollection = await db.collections
      .where("[spaceId+order]")
      .between([targetSpaceId, Dexie.minKey], [targetSpaceId, Dexie.maxKey])
      .last()
    await db.collections.update(collectionId, {
      spaceId: Number(targetSpaceId),
      order: lastCollection ? lastCollection.order + this.ORDER_STEP : 1000,
    })
  }

  async getLabels() {
    return db.labels.toArray()
  }

  async addLabel(title: string, color: string) {
    return db.labels.add({ title, color })
  }

  async removeLabel(id: number) {
    if (!id) return
    const collections = await db.collections
      .where("labelIds")
      .anyOf(id)
      .toArray()
    await Promise.all(
      collections.map(async (collection) => {
        await db.collections.update(collection.id, {
          labelIds: collection.labelIds.filter((labelId) => labelId !== id),
        })
      }),
    )
    return db.labels.delete(id)
  }

  async updateLabel(id: number, title: string, color?: string) {
    return db.labels.update(id, { title, ...(color && { color }) })
  }

  async addCard(card: Pick<Card, "title" | "url" | "collectionId">) {
    const lastCard = await db.cards
      .where(["collectionId+order"])
      .between(
        [card.collectionId, Dexie.minKey],
        [card.collectionId, Dexie.maxKey],
      )
      .last()
    return db.cards.add({
      ...card,
      order: lastCard ? lastCard.order + this.ORDER_STEP : 1000,
      customTitle: card.title,
      customDescription: card.title,
    })
  }

  async removeCard(id: number) {
    return db.cards.delete(id)
  }

  updateCardTitleAndDescription(
    id: number,
    { title, description }: { title?: string; description?: string },
  ) {
    return db.cards.update(id, {
      customTitle: title,
      customDescription: description,
    })
  }

  async moveCard(cardId: number, targetId: number) {
    const currentCard = await db.cards.get(cardId)
    if (!currentCard) return
    const allCards = await db.cards
      .where("[collectionId+order]")
      .between(
        [currentCard.collectionId, Dexie.minKey],
        [currentCard.collectionId, Dexie.maxKey],
      )
      .toArray()
    let targetIndex, currentIndex
    for (const [index, card] of allCards.entries()) {
      if (card.id === cardId) {
        currentIndex = index
      }
      if (card.id === targetId) {
        targetIndex = index
      }
    }
    if (isUndef(currentIndex) || isUndef(targetIndex)) return
    allCards.splice(currentIndex, 1)
    allCards.splice(targetIndex, 0, currentCard)
    await Promise.all(
      allCards.map(async (card, index) => {
        await db.cards.update(card.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async moveCardToCollection(cardId: number, targetCollectionId: number) {
    const currentCard = await db.cards.get(cardId)
    if (!currentCard) return
    const lastCard = await db.cards
      .where(["collectionId+order"])
      .between(
        [targetCollectionId, Dexie.minKey],
        [targetCollectionId, Dexie.maxKey],
      )
      .last()
    await db.cards.update(cardId, {
      collectionId: Number(targetCollectionId),
      order: lastCard ? lastCard.order + this.ORDER_STEP : 1000,
    })
  }

  async getCollectionWithCards(
    spaceId: number,
  ): Promise<CollectionWithCards[]> {
    const collections = await db.collections
      .where("[spaceId+order]")
      .between([spaceId, Dexie.minKey], [spaceId, Dexie.maxKey])
      .toArray()
    return await Promise.all(
      collections.map(async (collection) => {
        const cards = await db.cards
          .where({ collectionId: collection.id })
          .sortBy("order")
        const labels = await db.labels
          .where("id")
          .anyOf(collection.labelIds)
          .toArray()
        return { ...collection, cards, labels }
      }),
    )
  }

  async batchAddCards(cards: Omit<Card, "id">[]) {
    return db.cards.bulkAdd(cards)
  }
}

export default dataManager
