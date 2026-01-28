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
  Favicon,
  ExportSpace,
} from "@/type.ts"
import { db } from "./database.ts"

type TableName = "spaces" | "collections" | "labels" | "cards" | "favicons"

class DataManager {
  private static instance: DataManager
  ORDER_STEP: number
  private onModify?: (table: TableName) => void

  constructor() {
    this.ORDER_STEP = 1000
  }

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  // 设置数据修改回调（供 syncManager 调用）
  setOnModify(callback: (table: TableName) => void) {
    this.onModify = callback
  }

  // 通知数据已修改
  private notifyModify(table: TableName) {
    this.onModify?.(table)
  }

  async getAllSpaces() {
    return db.spaces.orderBy("order").toArray()
  }

  async addSpace(space: InsertType<Space, "id" | "order">) {
    const lastSpace = await db.spaces.orderBy("order").last()
    const { title, icon } = space
    const result = await db.spaces.add({
      title: title || "",
      ...(icon && { icon }),
      order: lastSpace ? lastSpace.order + this.ORDER_STEP : this.ORDER_STEP,
      createdAt: Date.now(),
    })
    this.notifyModify("spaces")
    return result
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
    this.notifyModify("spaces")
    this.notifyModify("collections")
    this.notifyModify("cards")
  }

  async updateSpaceTitle(id: number, title: string, icon?: string) {
    const result = await db.spaces.update(id, { title, ...(icon && { icon }) })
    this.notifyModify("spaces")
    return result
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
    this.notifyModify("spaces")
  }

  async getAllCollections() {
    return db.collections.orderBy("order").toArray()
  }

  async addCollection(
    collection: Omit<Collection, "id" | "order">,
    position: movePosition = "END",
  ) {
    let result: number | undefined
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
            result = await db.collections.add({
              title: collection.title || "",
              spaceId: collection.spaceId,
              labelIds: collection.labelIds,
              order: (index + 1) * this.ORDER_STEP,
              createdAt: Date.now(),
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
      result = await db.collections.add({
        title: collection.title || "",
        spaceId: collection.spaceId,
        labelIds: collection.labelIds,
        order: lastCollection ? lastCollection.order + this.ORDER_STEP : 1000,
        createdAt: Date.now(),
      })
    }
    this.notifyModify("collections")
    return result
  }

  async removeCollection(id: number) {
    await db.transaction("rw", db.collections, db.cards, async () => {
      await db.cards.where("collectionId").equals(id).delete()
      await db.collections.delete(id)
    })
    this.notifyModify("collections")
    this.notifyModify("cards")
  }

  async updateCollectionTitle(collectionId: number, title: string) {
    const result = await db.collections.update(collectionId, { title })
    this.notifyModify("collections")
    return result
  }

  async addTagforCollection(collectionId: number, tagId: number) {
    const result = await db.transaction("rw", db.collections, async () => {
      const collection = await db.collections.get(collectionId)
      if (!collection) return

      const labelIdSet = new Set(collection.labelIds)
      if (labelIdSet.has(tagId)) return

      labelIdSet.add(tagId)
      return db.collections.update(collectionId, {
        labelIds: Array.from(labelIdSet),
      })
    })
    this.notifyModify("collections")
    return result
  }

  async removeTagforCollection(collectionId: number, tagId: number) {
    const result = await db.transaction("rw", db.collections, async () => {
      const collection = await db.collections.get(collectionId)
      if (!collection) return

      const labelIdSet = new Set(collection.labelIds)
      if (!labelIdSet.has(tagId)) return

      labelIdSet.delete(tagId)
      return db.collections.update(collectionId, {
        labelIds: Array.from(labelIdSet),
      })
    })
    this.notifyModify("collections")
    return result
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
    this.notifyModify("collections")
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
    this.notifyModify("collections")
  }

  async getLabels() {
    return db.labels.toArray()
  }

  async addLabel(title: string, color: string) {
    const result = await db.labels.add({ title, color })
    this.notifyModify("labels")
    return result
  }

  async getOrCreateLabelWithTitle(title: string, notify = true) {
    const label = await db.labels.where("title").equals(title).first()
    if (label) return label.id
    const randomIndex = Math.floor(Math.random() * COLOR_LIST.length)
    const result = (await db.labels.add({
      title,
      color: COLOR_LIST[randomIndex],
    })) as number
    if (notify) this.notifyModify("labels")
    return result
  }

  async getCardsByTitleOrUrl(titleOrUrl: string) {
    if (!titleOrUrl) return []
    const searchText = titleOrUrl.toLowerCase()

    const searchInText = (text?: string) => {
      if (!text) return false
      return text?.toLowerCase().includes(searchText) ?? false
    }

    const cards = await db.cards
      .filter(
        (card) =>
          searchInText(card.title) ||
          searchInText(card.url) ||
          searchInText(card.description),
      )
      .toArray()

    const faviconIds: number[] = cards
      .map((card) => card.faviconId)
      .filter((id): id is number => id !== undefined)
    if (faviconIds.length === 0) return cards
    const favicons = await db.favicons.where("id").anyOf(faviconIds).toArray()
    const faviconMap = new Map(
      favicons.map((favicon) => [favicon.id, favicon.url]),
    )
    return cards.map((card) => ({
      ...card,
      favicon: card.faviconId ? faviconMap.get(card.faviconId) || "" : "",
    }))
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
    const result = await db.labels.delete(id)
    this.notifyModify("labels")
    this.notifyModify("collections")
    return result
  }

  async updateLabel(id: number, title: string, color?: string) {
    const result = await db.labels.update(id, {
      title,
      ...(color && { color }),
    })
    this.notifyModify("labels")
    return result
  }

  async addCard(card: Omit<Card, "id" | "order">, targetIndex?: number) {
    const cards = await db.cards
      .where("[collectionId+order]")
      .between(
        [card.collectionId, Dexie.minKey],
        [card.collectionId, Dexie.maxKey],
      )
      .toArray()

    let result: number
    // 如果没有指定位置或者集合为空，添加到末尾
    if (typeof targetIndex === "undefined" || cards.length === 0) {
      const lastOrder = cards.length > 0 ? cards[cards.length - 1].order : 0
      result = await db.cards.add({
        title: card.title || "",
        url: card.url || "",
        collectionId: card.collectionId,
        faviconId: card.faviconId,
        description: "",
        order: lastOrder + this.ORDER_STEP,
        createdAt: Date.now(),
      })
    } else {
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
      result = await db.cards.add({
        title: card.title || "",
        url: card.url || "",
        collectionId: card.collectionId,
        faviconId: card.faviconId,
        description: "",
        order: newOrder,
        createdAt: Date.now(),
      })
    }
    this.notifyModify("cards")
    return result
  }

  async removeCard(id: number) {
    const result = await db.cards.delete(id)
    this.notifyModify("cards")
    return result
  }

  async updateCard(
    id: number,
    {
      title,
      description,
      faviconId,
      url,
    }: {
      title: string
      description?: string
      faviconId?: number
      url?: string
    },
  ) {
    const result = await db.cards.update(id, {
      title,
      description,
      faviconId,
      url,
    })
    this.notifyModify("cards")
    return result
  }

  async updateCardFavicon(id: number, favicon: string) {
    const faviconId = await this.addFavicon(favicon, false)
    const result = await db.cards.update(id, { faviconId })
    this.notifyModify("cards")
    this.notifyModify("favicons")
    return result
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
    this.notifyModify("cards")
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
      await db.cards.update(cardId, {
        collectionId: targetCollectionId,
        order: lastOrder + this.ORDER_STEP,
      })
    } else {
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
    this.notifyModify("cards")
  }

  async batchUpdateCards(
    cardIds: number[],
    updateData: Partial<Card>,
    position?: movePosition,
  ) {
    await db.transaction("rw", db.cards, async () => {
      if (updateData.collectionId !== undefined) {
        const allCollections = await db.cards
          .where("[collectionId+order]")
          .between(
            [updateData.collectionId, Dexie.minKey],
            [updateData.collectionId, Dexie.maxKey],
          )
          .toArray()

        const toCollections = allCollections.filter(
          (card) => !cardIds.includes(card.id),
        )
        const movingCards = await db.cards.where("id").anyOf(cardIds).toArray()
        if (position === "HEAD") {
          toCollections.unshift(...movingCards)
        } else if (position === "END" || position === undefined) {
          toCollections.push(...movingCards)
        }

        const cardIdSet = new Set(cardIds)
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
      }
    })
    this.notifyModify("cards")
  }

  async batchDeleteCards(cardIds: number[]) {
    await db.transaction("rw", db.cards, async () => {
      await db.cards.bulkDelete(cardIds)
    })
    this.notifyModify("cards")
  }

  async batchUpdateCollections(
    collectionIds: number[],
    updateData: Partial<Collection>,
    position?: movePosition,
  ) {
    await db.transaction("rw", db.collections, async () => {
      if (updateData.spaceId !== undefined) {
        const allSpaces = await db.collections
          .where("[spaceId+order]")
          .between(
            [updateData.spaceId, Dexie.minKey],
            [updateData.spaceId, Dexie.maxKey],
          )
          .toArray()

        const toSpaces = allSpaces.filter(
          (collection) => !collectionIds.includes(collection.id),
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

        const collectionIdSet = new Set(collectionIds)

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
      }
    })
    this.notifyModify("collections")
  }

  async batchDeleteCollections(collectionIds: number[]) {
    await db.transaction("rw", db.collections, db.cards, async () => {
      await db.cards.where("collectionId").anyOf(collectionIds).delete()
      await db.collections.bulkDelete(collectionIds)
    })
    this.notifyModify("collections")
    this.notifyModify("cards")
  }

  async getCardWithCollectionIds(collectionIds: number[]) {
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
    spaceId: number,
  ): Promise<CollectionWithCards[]> {
    const collections = await db.collections
      .where("[spaceId+order]")
      .between([spaceId, Dexie.minKey], [spaceId, Dexie.maxKey])
      .toArray()

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

  async batchAddCards(cards: Omit<Card, "id">[], notify = true) {
    const result = await db.cards.bulkAdd(cards)
    if (notify) this.notifyModify("cards")
    return result
  }

  async addFavicon(url: string | undefined, notify = true) {
    if (!url) return
    const _url = url.trim()
    const isExist = await db.favicons.where("url").equals(_url).first()
    if (isExist) return isExist.id
    const result = await db.favicons.add({ url: _url })
    if (notify) this.notifyModify("favicons")
    return result
  }

  async getFaviconById(id: number) {
    return db.favicons.get(id)
  }

  async getAllSpaceWithCollections(): Promise<SpaceWithCollections[]> {
    const spaces = await db.spaces.orderBy("order").toArray()
    const collections = await db.collections.orderBy("order").toArray()
    return spaces.map((space) => ({
      ...space,
      collections: collections.filter(
        (collection) => collection.spaceId === space.id,
      ),
    }))
  }

  async getUploadData() {
    const spaces = await db.spaces.toArray()
    const collections = await db.collections.toArray()
    const labels = await db.labels.toArray()
    const cards = await db.cards.toArray()
    const favicons = await db.favicons.toArray()
    return {
      spaces: spaces.map((space) => ({
        id: space.id,
        title: space.title,
        icon: space.icon,
        order: space.order,
        createdAt: space.createdAt,
      })),
      collections: collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        spaceId: collection.spaceId,
        order: collection.order,
        labelIds: collection.labelIds,
        createdAt: collection.createdAt,
      })),
      labels: labels.map((label) => ({
        id: label.id,
        title: label.title,
        color: label.color,
      })),
      cards: cards.map((card) => ({
        id: card.id,
        title: card.title,
        url: card.url,
        order: card.order,
        faviconId: card.faviconId,
        description: card.description,
        collectionId: card.collectionId,
        createdAt: card.createdAt,
      })),
      favicons: favicons.map((favicon) => ({
        id: favicon.id,
        url: favicon.url,
      })),
    }
  }

  private stripMetadata<T extends { createdAt?: number; id?: number }>(
    obj: T,
    additionalFields: (keyof T)[] = [],
  ): Partial<T> {
    const { createdAt: _, id: _id, ...rest } = obj
    const result = { ...rest } as Partial<T>
    additionalFields.forEach((field) => {
      if (field in result) {
        delete result[field]
      }
    })
    return result
  }

  async exportBySpaceId(spaceIds: number[]) {
    const spaces = await db.spaces.where("id").anyOf(spaceIds).sortBy("order")
    const labels = await db.labels.toArray()
    const labelsMap = new Map(labels.map((label) => [label.id, label]))
    const favicons = await db.favicons.toArray()
    const faviconsMap = new Map(
      favicons.map((favicon) => [favicon.id, favicon.url]),
    )
    return Promise.all(
      spaces.map(async (space) => {
        const spaceData = this.stripMetadata(space, ["order"])
        const collections = await db.collections
          .where({ spaceId: space.id })
          .sortBy("order")

        const spaceCollections = await Promise.all(
          collections.map(async (collection) => {
            const collectionCards = await db.cards
              .where({ collectionId: collection.id })
              .sortBy("order")

            return {
              ...this.stripMetadata(collection, [
                "order",
                "labelIds",
                "spaceId",
              ]),
              labels: collection.labelIds
                .map((labelId) => {
                  const label = labelsMap.get(labelId)
                  return label ? this.stripMetadata(label) : null
                })
                .filter((label) => label !== null),
              cards: await Promise.all(
                collectionCards.map(async (card) => {
                  return {
                    ...this.stripMetadata(card, [
                      "order",
                      "collectionId",
                      "faviconId",
                    ]),
                    favicon: card.faviconId
                      ? faviconsMap.get(card.faviconId)
                      : "",
                  }
                }),
              ),
            }
          }),
        )

        return {
          ...spaceData,
          collections: spaceCollections,
        }
      }),
    )
  }

  async importData(data: {
    spaces: Space[]
    collections: Collection[]
    labels: Label[]
    cards: Card[]
    favicons: Favicon[]
  }) {
    const tablesToLock: Dexie.Table[] = [
      db.spaces,
      db.collections,
      db.labels,
      db.cards,
      db.favicons,
    ]
    try {
      await db.transaction("rw", tablesToLock, async () => {
        await Promise.all([
          db.spaces.clear(),
          db.collections.clear(),
          db.labels.clear(),
          db.cards.clear(),
          db.favicons.clear(),
        ])
        const chunkSize = 100
        if (data.spaces && data.spaces.length > 0) {
          await db.spaces.bulkPut(data.spaces)
        }
        if (data.collections && data.collections.length > 0) {
          await db.collections.bulkPut(data.collections)
        }
        if (data.labels && data.labels.length > 0) {
          await db.labels.bulkPut(data.labels)
        }
        let faviconsToImport: Favicon[] = []
        if (
          data.cards &&
          data.cards.length > 0 &&
          data.favicons &&
          data.favicons.length > 0
        ) {
          const usedFaviconIds = new Set<number>()
          data.cards.forEach((card) => {
            if (card.faviconId && card.faviconId > 0) {
              usedFaviconIds.add(card.faviconId)
            }
          })
          faviconsToImport = data.favicons.filter((favicon) =>
            usedFaviconIds.has(favicon.id),
          )
        } else {
          faviconsToImport =
            data.favicons && data.cards?.length === 0 ? data.favicons : []
        }
        if (faviconsToImport.length > 0) {
          const numChunks = Math.ceil(faviconsToImport.length / chunkSize)
          for (let i = 0; i < numChunks; i++) {
            const start = i * chunkSize
            const end = start + chunkSize
            const chunk = faviconsToImport.slice(start, end)
            await db.favicons.bulkPut(chunk)
          }
        }

        if (data.cards && data.cards.length > 0) {
          const numChunks = Math.ceil(data.cards.length / chunkSize)
          for (let i = 0; i < numChunks; i++) {
            const start = i * chunkSize
            const end = start + chunkSize
            const chunk = data.cards.slice(start, end)
            await db.cards.bulkPut(chunk)
          }
        }
      })
    } catch (error) {
      console.error("Data import failed:", error)
    }
  }

  async importFromToby(lists: CollectionWithCards[]) {
    db.transaction(
      "rw",
      [db.spaces, db.collections, db.cards, db.favicons, db.labels],
      async () => {
        const spaceId = await this.addSpace({
          title: "From Toby",
          icon: "StorefrontOutline",
        })
        for (const list of lists) {
          const labelIds: number[] = []
          for (const label of list.labels) {
            const labelId = await this.getOrCreateLabelWithTitle(label.title)
            if (labelId) {
              labelIds.push(labelId)
            }
          }
          const collectionId = await this.addCollection({
            title: list.title,
            spaceId,
            labelIds: labelIds,
          })
          await this.batchAddCards(
            list.cards.map((card, index) => {
              const now = Date.now()
              return {
                title: card.customTitle || card.title,
                url: card.url,
                description: card.customDescription || card.description || "",
                collectionId: collectionId!,
                order: (index + 1) * 1000,
                createdAt: now,
              }
            }),
          )
        }
      },
    )
  }

  async importFromTaby(spaces: ExportSpace[]) {
    db.transaction(
      "rw",
      [db.spaces, db.collections, db.cards, db.favicons, db.labels],
      async () => {
        for (const space of spaces) {
          const spaceId = await this.addSpace({
            title: space.title,
            icon: space.icon,
          })
          for (const collection of space.collections) {
            const labelIds: number[] = []
            for (const label of collection.labels) {
              const labelId = await this.getOrCreateLabelWithTitle(label.title)
              if (labelId) {
                labelIds.push(labelId)
              }
            }
            const collectionId = await this.addCollection({
              title: collection.title,
              spaceId,
              labelIds,
            })
            const cards: Omit<Card, "id">[] = []
            for (const [index, card] of collection.cards.entries()) {
              let faviconId: number | undefined
              if (card.favicon) {
                faviconId = await this.addFavicon(card.favicon)
              }
              cards.push({
                title: card.title,
                url: card.url,
                description: card.description,
                collectionId: collectionId!,
                ...(faviconId && { faviconId }),
                order: (index + 1) * 1000,
                createdAt: Date.now(),
              })
            }
            await this.batchAddCards(cards)
          }
        }
      },
    )
  }
}

export default DataManager.getInstance()
