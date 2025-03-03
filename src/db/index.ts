import { COLOR_LIST } from "@/utils/constants.ts"
import Dexie from "dexie"
import { isUndef } from "@/utils/is.ts"
import { Card, Collection, CollectionWithCards, Space } from "@/type.ts"
import { db } from "./database.ts"

class dataManager {
  ORDER_STEP: number
  constructor() {
    this.ORDER_STEP = 1000
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

  async updateSpaceTitle(id: number, title: string, icon?: string) {
    return db.spaces.update(id, { title, ...(icon && { icon }) })
  }

  async moveSpace(spaceId: number, oldIndex: number, newIndex: number) {
    const currentSpace = await db.spaces.get(spaceId)
    if (!currentSpace) return
    const allSpaces = await db.spaces.orderBy("order").toArray()
    allSpaces.splice(oldIndex, 1)
    allSpaces.splice(newIndex, 0, currentSpace)
    await Promise.all(
      allSpaces.map(async (space, index) => {
        await db.spaces.update(space.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async addCollection(collection: Omit<Collection, "id" | "order">) {
    console.log("collection: ", collection)
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

  async getOrCreateLabelWithTitle(title: string) {
    const label = await db.labels.where("title").equals(title).first()
    if (label) return label.id
    const randomIndex = Math.floor(Math.random() * COLOR_LIST.length)
    return (await db.labels.add({
      title,
      color: COLOR_LIST[randomIndex],
    })) as number
  }

  async getCardsByTitleOrUrl(titleOrUrl: string) {
    if (!titleOrUrl) return []
    const searchText = titleOrUrl.toLowerCase()

    const searchInText = (text?: string) => {
      if (!text) return false
      return text?.toLowerCase().includes(searchText) ?? false
    }

    return db.cards
      .filter(
        (card) =>
          searchInText(card.title) ||
          searchInText(card.url) ||
          searchInText(card.customTitle) ||
          searchInText(card.customDescription),
      )
      .toArray()
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

  async addCard(
    card: Pick<Card, "title" | "url" | "collectionId" | "favicon">,
    targetIndex?: number,
  ) {
    const cards = await db.cards
      .where("[collectionId+order]")
      .between(
        [card.collectionId, Dexie.minKey],
        [card.collectionId, Dexie.maxKey],
      )
      .toArray()

    // 如果没有指定位置或者集合为空，添加到末尾
    if (typeof targetIndex === "undefined" || cards.length === 0) {
      const lastOrder = cards.length > 0 ? cards[cards.length - 1].order : 0
      return db.cards.add({
        ...card,
        order: lastOrder + this.ORDER_STEP,
        customTitle: card.title,
        customDescription: card.title,
      })
    }

    // 在指定位置插入
    const newOrder = (targetIndex + 1) * this.ORDER_STEP

    // 更新目标位置后所有卡片的顺序
    await Promise.all(
      cards.slice(targetIndex).map(async (existingCard, index) => {
        await db.cards.update(existingCard.id, {
          order: newOrder + (index + 1) * this.ORDER_STEP,
        })
      }),
    )

    // 添加新卡片
    return db.cards.add({
      ...card,
      order: newOrder,
      customTitle: card.title,
      customDescription: card.title,
    })
  }

  async removeCard(id: number) {
    return db.cards.delete(id)
  }

  updateCard(
    id: number,
    {
      title,
      description,
      favicon,
    }: { title?: string; description?: string; favicon?: string },
  ) {
    return db.cards.update(id, {
      customTitle: title,
      customDescription: description,
      favicon,
    })
  }
  async updateCardFavicon(id: number, favicon: string) {
    return db.cards.update(id, { favicon })
  }

  async moveCard(cardId: number, oldIndex: number, newIndex: number) {
    const currentCard = await db.cards.get(cardId)
    if (!currentCard) return
    const allCards = await db.cards
      .where("[collectionId+order]")
      .between(
        [currentCard.collectionId, Dexie.minKey],
        [currentCard.collectionId, Dexie.maxKey],
      )
      .toArray()
    allCards.splice(oldIndex, 1)
    allCards.splice(newIndex, 0, currentCard)
    await Promise.all(
      allCards.map(async (card, index) => {
        await db.cards.update(card.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async moveCardToCollection(
    cardId: number,
    targetCollectionId: number,
    targetIndex?: number,
  ) {
    const currentCard = await db.cards.get(cardId)
    if (!currentCard) return

    const targetCards = await db.cards
      .where("[collectionId+order]")
      .between(
        [targetCollectionId, Dexie.minKey],
        [targetCollectionId, Dexie.maxKey],
      )
      .toArray()

    if (typeof targetIndex === "undefined") {
      const lastOrder =
        targetCards.length > 0 ? targetCards[targetCards.length - 1].order : 0
      return db.cards.update(cardId, {
        collectionId: targetCollectionId,
        order: lastOrder + this.ORDER_STEP,
      })
    }

    targetCards.splice(targetIndex, 0, currentCard)

    await Promise.all(
      targetCards.map(async (card, index) => {
        if (card.id === cardId) {
          await db.cards.update(cardId, {
            collectionId: targetCollectionId,
            order: (index + 1) * this.ORDER_STEP,
          })
        } else {
          await db.cards.update(card.id, {
            order: (index + 1) * this.ORDER_STEP,
          })
        }
      }),
    )
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

  async getCard(cardId: number) {
    return await db.cards.get(cardId)
  }
}

export default dataManager
