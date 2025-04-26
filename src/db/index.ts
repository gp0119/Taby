import { COLOR_LIST } from "@/utils/constants.ts"
import Dexie, { InsertType } from "dexie"
import {
  Card,
  Collection,
  CollectionWithCards,
  movePosition,
  Space,
  Label,
  SpaceWithCollections,
} from "@/type.ts"
import { db } from "./database.ts"
import { v4 as uuidv4 } from "uuid"

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

  async addSpace(space: Pick<Space, "title" | "icon">) {
    const lastSpace = await db.spaces.orderBy("order").last()
    const { title, icon } = space
    const newSpace: Space = {
      id: uuidv4(),
      title: title || "",
      ...(icon && { icon }),
      order: lastSpace ? lastSpace.order + this.ORDER_STEP : this.ORDER_STEP,
      createdAt: Date.now(),
    }
    await db.spaces.add(newSpace)
    return newSpace.id
  }

  async removeSpace(id: string) {
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

  async updateSpaceTitle(id: string, title: string, icon?: string) {
    return db.spaces.update(id, { title, ...(icon && { icon }) })
  }

  async moveSpace(spaceId: string, oldIndex: number, newIndex: number) {
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
    collection: Pick<Collection, "title" | "spaceId" | "labelIds">,
    position: movePosition = "END",
  ) {
    const spaceId = String(collection.spaceId)
    const labelIds = (collection.labelIds || []).map(String)

    if (position === "HEAD") {
      const collections = await db.collections
        .where("[spaceId+order]")
        .between([spaceId, Dexie.minKey], [spaceId, Dexie.maxKey])
        .toArray()

      const newCollection: Collection = {
        id: uuidv4(),
        title: collection.title || "",
        spaceId: spaceId,
        labelIds: labelIds,
        order: this.ORDER_STEP / 2,
        createdAt: Date.now(),
      }

      collections.unshift(newCollection)

      await Promise.all(
        collections.map(async (col, index) => {
          const newOrder = (index + 1) * this.ORDER_STEP
          if (col.id === newCollection.id) {
            await db.collections.add({ ...col, order: newOrder })
          } else {
            await db.collections.update(col.id, { order: newOrder })
          }
        }),
      )
      return newCollection.id
    } else if (position === "END") {
      const lastCollection = await db.collections
        .where("[spaceId+order]")
        .between([spaceId, Dexie.minKey], [spaceId, Dexie.maxKey])
        .last()

      const newCollection: Collection = {
        id: uuidv4(),
        title: collection.title || "",
        spaceId: spaceId,
        labelIds: labelIds,
        order: lastCollection
          ? lastCollection.order + this.ORDER_STEP
          : this.ORDER_STEP,
        createdAt: Date.now(),
      }
      await db.collections.add(newCollection)
      return newCollection.id
    }
  }

  async removeCollection(id: string) {
    await db.transaction("rw", db.collections, db.cards, async () => {
      await db.cards.where("collectionId").equals(id).delete()
      await db.collections.delete(id)
    })
  }

  async updateCollectionTitle(collectionId: string, title: string) {
    return db.collections.update(collectionId, { title })
  }

  async addTagforCollection(collectionId: string, tagId: string) {
    return db.transaction("rw", db.collections, async () => {
      const collection = await db.collections.get(collectionId)
      if (!collection) return

      const labelIdSet = new Set(collection.labelIds || [])
      if (labelIdSet.has(tagId)) return

      labelIdSet.add(tagId)
      return db.collections.update(collectionId, {
        labelIds: Array.from(labelIdSet),
      })
    })
  }

  async removeTagforCollection(collectionId: string, tagId: string) {
    return db.transaction("rw", db.collections, async () => {
      const collection = await db.collections.get(collectionId)
      if (!collection) return

      const labelIdSet = new Set(collection.labelIds || [])
      if (!labelIdSet.has(tagId)) return

      labelIdSet.delete(tagId)
      return db.collections.update(collectionId, {
        labelIds: Array.from(labelIdSet),
      })
    })
  }

  async moveCollection(
    collectionId: string,
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

  async moveCollectionToSpace(collectionId: string, targetSpaceId: string) {
    const currentCollection = await db.collections.get(collectionId)
    if (!currentCollection) return
    const lastCollection = await db.collections
      .where("[spaceId+order]")
      .between([targetSpaceId, Dexie.minKey], [targetSpaceId, Dexie.maxKey])
      .last()
    await db.collections.update(collectionId, {
      spaceId: targetSpaceId,
      order: lastCollection ? lastCollection.order + this.ORDER_STEP : 1000,
    })
  }

  async getLabels() {
    return db.labels.toArray()
  }

  async addLabel(title: string, color: string) {
    const newLabel: Label = {
      id: uuidv4(),
      title,
      color,
    }
    await db.labels.add(newLabel)
    return newLabel.id
  }

  async getOrCreateLabelWithTitle(title: string): Promise<string> {
    const label = await db.labels.where("title").equals(title).first()
    if (label) return label.id
    const randomIndex = Math.floor(Math.random() * COLOR_LIST.length)
    const newLabel: Label = {
      id: uuidv4(),
      title,
      color: COLOR_LIST[randomIndex],
    }
    await db.labels.add(newLabel)
    return newLabel.id
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

  async removeLabel(id: string) {
    if (!id) return
    const collections = await db.collections
      .where("labelIds")
      .anyOf(id)
      .toArray()
    await Promise.all(
      collections.map(async (collection) => {
        await db.collections.update(collection.id, {
          labelIds: (collection.labelIds || []).filter(
            (labelId) => labelId !== id,
          ),
        })
      }),
    )
    return db.labels.delete(id)
  }

  async updateLabel(id: string, title: string, color?: string) {
    return db.labels.update(id, { title, ...(color && { color }) })
  }

  async addCard(
    card: Pick<Card, "title" | "url" | "collectionId" | "faviconId">,
    targetIndex?: number,
  ) {
    const collectionId = String(card.collectionId)
    const faviconId = card.faviconId ? String(card.faviconId) : undefined

    const cards = await db.cards
      .where("[collectionId+order]")
      .between([collectionId, Dexie.minKey], [collectionId, Dexie.maxKey])
      .toArray()

    const newCardBase: Omit<
      Card,
      "id" | "order" | "createdAt" | "description"
    > = {
      title: card.title || "",
      url: card.url || "",
      collectionId: collectionId,
      ...(faviconId && { faviconId }),
    }

    if (typeof targetIndex === "undefined" || cards.length === 0) {
      const lastOrder = cards.length > 0 ? cards[cards.length - 1].order : 0
      const newCard: Card = {
        ...newCardBase,
        id: uuidv4(),
        description: "",
        order: lastOrder + this.ORDER_STEP,
        createdAt: Date.now(),
      }
      await db.cards.add(newCard)
      return newCard.id
    }

    const newOrder = (targetIndex + 1) * this.ORDER_STEP
    const newCard: Card = {
      ...newCardBase,
      id: uuidv4(),
      description: "",
      order: newOrder,
      createdAt: Date.now(),
    }

    await Promise.all(
      cards.slice(targetIndex).map(async (existingCard) => {
        await db.cards.update(existingCard.id, {
          order: existingCard.order + this.ORDER_STEP,
        })
      }),
    )

    await db.cards.add(newCard)
    return newCard.id
  }

  async removeCard(id: string) {
    return db.cards.delete(id)
  }

  updateCard(
    id: string,
    {
      title,
      description,
      faviconId,
    }: { title: string; description?: string; faviconId?: string },
  ) {
    return db.cards.update(id, {
      title,
      description,
      faviconId,
    })
  }

  async updateCardFavicon(id: string, favicon: string) {
    const faviconId = await this.addFavicon(favicon)
    return db.cards.update(id, { faviconId })
  }

  async moveCard(cardId: string, oldIndex: number, newIndex: number) {
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
    cardId: string,
    targetCollectionId: string,
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

    const newOrder = (targetIndex + 1) * this.ORDER_STEP

    await db.cards.update(cardId, {
      collectionId: targetCollectionId,
      order: newOrder,
    })

    await Promise.all(
      targetCards.slice(targetIndex).map(async (card) => {
        await db.cards.update(card.id, {
          order: card.order + this.ORDER_STEP,
        })
      }),
    )
  }

  async batchUpdateCards(
    cardIds: string[],
    updateData: Partial<Card>,
    position?: movePosition,
  ) {
    return db.transaction("rw", db.cards, async () => {
      if (updateData.collectionId !== undefined) {
        const allCollections = await db.cards
          .where("[collectionId+order]")
          .between(
            [updateData.collectionId, Dexie.minKey],
            [updateData.collectionId, Dexie.maxKey],
          )
          .toArray()

        const cardIdSet = new Set(cardIds)
        const toCollections = allCollections.filter(
          (card) => !cardIdSet.has(card.id),
        )
        const movingCards = await db.cards.where("id").anyOf(cardIds).toArray()
        if (position === "HEAD") {
          toCollections.unshift(...movingCards)
        } else if (position === "END" || position === undefined) {
          toCollections.push(...movingCards)
        }

        await Promise.all(
          toCollections.map(async (card, index) => {
            await db.cards.update(card.id, {
              ...(cardIdSet.has(card.id) && {
                ...updateData,
              }),
              order: (index + 1) * this.ORDER_STEP,
            })
          }),
        )
      } else {
        await db.cards.where("id").anyOf(cardIds).modify(updateData)
      }
    })
  }

  async batchDeleteCards(cardIds: string[]) {
    await db.transaction("rw", db.cards, async () => {
      await db.cards.bulkDelete(cardIds)
    })
  }

  async batchUpdateCollections(
    collectionIds: string[],
    updateData: Partial<Collection>,
    position?: movePosition,
  ) {
    return db.transaction("rw", db.collections, async () => {
      if (updateData.spaceId !== undefined) {
        const allSpaces = await db.collections
          .where("[spaceId+order]")
          .between(
            [updateData.spaceId, Dexie.minKey],
            [updateData.spaceId, Dexie.maxKey],
          )
          .toArray()

        const collectionIdSet = new Set(collectionIds)
        const toSpaces = allSpaces.filter(
          (collection) => !collectionIdSet.has(collection.id),
        )

        const movingCollections = await db.collections
          .where("id")
          .anyOf(collectionIds)
          .toArray()

        if (position === "HEAD") {
          toSpaces.unshift(...movingCollections)
        } else if (position === "END" || position === undefined) {
          toSpaces.push(...movingCollections)
        }

        await Promise.all(
          toSpaces.map(async (collection, index) => {
            await db.collections.update(collection.id, {
              ...(collectionIdSet.has(collection.id) && {
                ...updateData,
              }),
              order: (index + 1) * this.ORDER_STEP,
            })
          }),
        )
      } else {
        await db.collections.where("id").anyOf(collectionIds).modify(updateData)
      }
    })
  }

  async batchDeleteCollections(collectionIds: string[]) {
    await db.transaction("rw", db.collections, db.cards, async () => {
      await db.cards.where("collectionId").anyOf(collectionIds).delete()
      await db.collections.bulkDelete(collectionIds)
    })
  }

  async getCardWithCollectionIds(collectionIds: string[]) {
    const movingCards: Card[] = []
    for (const collectionId of collectionIds) {
      const cards = await db.cards
        .where("[collectionId+order]")
        .between([collectionId, Dexie.minKey], [collectionId, Dexie.maxKey])
        .toArray()
      movingCards.push(...cards)
    }
    return movingCards
  }

  async getCollectionWithCards(
    spaceId: string,
  ): Promise<CollectionWithCards[]> {
    console.log("spaceId: ", spaceId)
    const collections = await db.collections
      .where("[spaceId+order]")
      .between([spaceId, Dexie.minKey], [spaceId, Dexie.maxKey])
      .toArray()
    console.log("collections: ", collections)
    const labels = await db.labels.toArray()
    const labelMap = new Map(labels.map((label) => [label.id, label]))
    const favicons = await db.favicons.toArray()
    const faviconMap = new Map(
      favicons.map((favicon) => [favicon.id, favicon.url]),
    )
    return await Promise.all(
      collections.map(async (collection) => {
        const cards = await db.cards
          .where({ collectionId: collection.id })
          .sortBy("order")
        const cardsWithFavicon = cards.map((card) => ({
          ...card,
          favicon: card.faviconId ? faviconMap.get(card.faviconId) || "" : "",
        }))
        return {
          ...collection,
          cards: cardsWithFavicon,
          labels: (collection.labelIds || [])
            .map((labelId) => labelMap.get(labelId))
            .filter((label): label is Label => label !== undefined),
        }
      }),
    )
  }

  async batchAddCards(cards: Omit<Card, "id">[]) {
    const cardsToAdd = cards.map((card) => ({
      ...card,
      id: uuidv4(),
      collectionId: String(card.collectionId || ""),
      faviconId: card.faviconId ? String(card.faviconId) : undefined,
      title: card.title || "",
      url: card.url || "",
      description: card.description || "",
      order: card.order || 0,
      createdAt: card.createdAt || Date.now(),
    }))
    return db.cards.bulkAdd(cardsToAdd)
  }

  async addFavicon(url: string | undefined): Promise<string | undefined> {
    if (!url) return
    let _url = url.trim()
    const isExist = await db.favicons.where("url").equals(_url).first()
    if (isExist) return isExist.id
    const newFavicon = { id: uuidv4(), url: _url }
    await db.favicons.add(newFavicon)
    return newFavicon.id
  }

  async getFaviconById(id: string) {
    return db.favicons.get(id)
  }

  async getAllSpaceWithCollections(): Promise<SpaceWithCollections[]> {
    const spaces = await db.spaces.toArray()
    const collections = await db.collections.toArray()
    return spaces.map((space) => ({
      ...space,
      collections: collections.filter(
        (collection) => collection.spaceId === space.id,
      ),
    }))
  }
}

export default DataManager.getInstance()
