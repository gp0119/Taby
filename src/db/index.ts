import { COLOR_LIST } from "@/utils/constants.ts"
import Dexie from "dexie"
import {
  Card,
  Collection,
  CollectionWithCards,
  movePosition,
  Space,
} from "@/type.ts"
import { db } from "./database.ts"

class DataManager {
  private static instance: DataManager
  ORDER_STEP: number
  constructor() {
    this.ORDER_STEP = 1000
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
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

  async getAllCollections() {
    return db.collections.orderBy("order").toArray()
  }

  async addCollection(
    collection: Omit<Collection, "id" | "order">,
    position: movePosition = "END",
  ) {
    if (position === "HEAD") {
      const collections = await db.collections
        .where("[spaceId+order]")
        .between(
          [collection.spaceId, Dexie.minKey],
          [collection.spaceId, Dexie.maxKey],
        )
        .toArray()
      collections.unshift(collection as Collection)
      await Promise.all(
        collections.map(async (collection, index) => {
          if (collection.id) {
            await db.collections.update(collection.id, {
              order: (index + 1) * this.ORDER_STEP,
            })
          } else {
            await db.collections.add({
              ...collection,
              order: (index + 1) * this.ORDER_STEP,
            })
          }
        }),
      )
    } else if (position === "END") {
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

  async moveCollection(
    collectionId: number,
    oldIndex: number,
    newIndex: number,
  ) {
    const currentCollection = await db.collections.get(collectionId)
    if (!currentCollection) return
    const allCollections = await db.collections
      .where({ spaceId: currentCollection.spaceId })
      .sortBy("order")
    allCollections.splice(oldIndex, 1)
    allCollections.splice(newIndex, 0, currentCollection)
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
          searchInText(card.description),
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
    card: Pick<Card, "title" | "url" | "collectionId" | "faviconId">,
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
        description: "",
        order: lastOrder + this.ORDER_STEP,
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
      description: "",
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
      faviconId,
    }: { title?: string; description?: string; faviconId?: number },
  ) {
    return db.cards.update(id, {
      title,
      description,
      faviconId,
    })
  }
  async updateCardFavicon(id: number, favicon: string) {
    const faviconId = await this.addFavicon(favicon)
    return db.cards.update(id, { faviconId })
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

  async batchUpdateCards(
    cardIds: number[],
    updateData: Partial<Card>,
    position?: movePosition,
  ) {
    const toCollections = await db.cards
      .where("[collectionId+order]")
      .between(
        [updateData.collectionId!, Dexie.minKey],
        [updateData.collectionId!, Dexie.maxKey],
      )
      .toArray()
    const moveingCards = await db.cards.where("id").anyOf(cardIds).toArray()
    if (position === "HEAD") {
      toCollections.unshift(...moveingCards)
    } else if (position === "END") {
      toCollections.push(...moveingCards)
    }
    await Promise.all(
      toCollections.map(async (card, index) => {
        await db.cards.update(card.id, {
          ...(cardIds.includes(card.id) && {
            ...updateData,
          }),
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async batchDeleteCards(cardIds: number[]) {
    return db.cards.bulkDelete(cardIds)
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
        const labels = []
        for (const labelId of collection.labelIds) {
          const label = await db.labels.get(labelId)
          if (label) {
            labels.push(label)
          }
        }
        const faviconIds = cards
          .map((card) => card.faviconId)
          .filter((id): id is number => id !== null && id !== undefined)
        const favicons =
          faviconIds.length > 0
            ? await db.favicons.where("id").anyOf(faviconIds).toArray()
            : []
        const faviconMap = new Map(
          favicons.map((favicon) => [favicon.id, favicon.url]),
        )
        const cardsWithFavicon = cards.map((card) => ({
          ...card,
          favicon: card.faviconId
            ? faviconMap.get(card.faviconId) || null
            : null,
        }))
        return { ...collection, cards: cardsWithFavicon, labels }
      }),
    )
  }

  async batchAddCards(cards: Omit<Card, "id">[]) {
    return db.cards.bulkAdd(cards)
  }

  async addFavicon(url: string) {
    const isExist = await db.favicons.where("url").equals(url).first()
    if (isExist) return isExist.id
    return db.favicons.add({ url })
  }

  async getFaviconById(id: number) {
    return db.favicons.get(id)
  }
}

export default DataManager.getInstance()
