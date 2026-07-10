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
  EntityUid,
  SyncData,
} from "@/type.ts"
import { db } from "./database.ts"
import { createEntityUid, isEntityUid } from "@/utils/entityUid.ts"

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

  // 计算把一个 item 插入 prev / next 之间应使用的 order 值。
  // 返回 null 表示密度过低（gap < 1），调用方需要做整表 rebalance。
  // 这样移动 / 在中间插入只需要 1 次 IDB write，而不是 N 次。
  private orderBetween(
    prev: { order: number } | null | undefined,
    next: { order: number } | null | undefined,
  ): number | null {
    const STEP = this.ORDER_STEP
    if (!prev && !next) return STEP
    if (!prev) {
      const n = next!.order
      if (n < 2) return null
      return n / 2
    }
    if (!next) return prev.order + STEP
    const gap = next.order - prev.order
    if (gap < 1) return null
    return (prev.order + next.order) / 2
  }

  // 设置数据修改回调（供 syncManager 调用）
  setOnModify(callback: (table: TableName) => void) {
    this.onModify = callback
  }

  // 通知数据已修改
  private notifyModify(table: TableName) {
    this.onModify?.(table)
  }

  private async addWithUid<T>(
    insert: (uid: EntityUid) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await insert(createEntityUid())
      } catch (error) {
        if (
          attempt === 2 ||
          !(error instanceof Error) ||
          error.name !== "ConstraintError"
        ) {
          throw error
        }
      }
    }
    throw new Error("Unable to generate a unique entity UID")
  }

  async getAllSpaces() {
    return db.spaces.orderBy("order").toArray()
  }

  async addSpace(space: InsertType<Space, "id" | "uid" | "order">) {
    const lastSpace = await db.spaces.orderBy("order").last()
    const { title, icon } = space
    const result = await this.addWithUid((uid) =>
      db.spaces.add({
        uid,
        title: title || "",
        order: lastSpace ? lastSpace.order + this.ORDER_STEP : this.ORDER_STEP,
        createdAt: Date.now(),
        icon: icon || "StorefrontOutline",
      }),
    )
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
    if (oldIndex === newIndex) return
    await db.transaction("rw", db.spaces, async () => {
      const currentSpace = await db.spaces.get(spaceId)
      if (!currentSpace) return
      const allSpaces = await db.spaces.orderBy("order").toArray()
      const filtered = allSpaces.filter((s) => s.id !== spaceId)
      const prev = newIndex > 0 ? filtered[newIndex - 1] : null
      const next = newIndex < filtered.length ? filtered[newIndex] : null
      const newOrder = this.orderBetween(prev, next)
      if (newOrder !== null) {
        await db.spaces.update(spaceId, { order: newOrder })
      } else {
        // 密度过低，整表 rebalance
        filtered.splice(newIndex, 0, currentSpace)
        await Promise.all(
          filtered.map((space, index) =>
            db.spaces.update(space.id, {
              order: (index + 1) * this.ORDER_STEP,
            }),
          ),
        )
      }
    })
    this.notifyModify("spaces")
  }

  async getAllCollections() {
    return db.collections.orderBy("order").toArray()
  }

  async addCollection(
    collection: Omit<Collection, "id" | "uid" | "order">,
    position: movePosition = "END",
  ) {
    let result: number | undefined
    await db.transaction("rw", db.collections, async () => {
      if (position === "HEAD") {
        const collections = await db.collections
          .where("[spaceId+order]")
          .between(
            [collection.spaceId, Dexie.minKey],
            [collection.spaceId, Dexie.maxKey],
          )
          .toArray()
        const first = collections[0]
        const newOrder = this.orderBetween(null, first)
        if (newOrder !== null) {
          result = await this.addWithUid((uid) =>
            db.collections.add({
              uid,
              title: collection.title || "",
              spaceId: collection.spaceId,
              labelIds: collection.labelIds,
              order: newOrder,
              createdAt: Date.now(),
            }),
          )
        } else {
          // 密度过低 → 整组 rebalance（保留旧逻辑作为兜底）
          collections.unshift(collection as Collection)
          await Promise.all(
            collections.map(async (c, index) => {
              if (c.id) {
                await db.collections.update(c.id, {
                  order: (index + 1) * this.ORDER_STEP,
                })
              } else {
                result = await this.addWithUid((uid) =>
                  db.collections.add({
                    uid,
                    title: c.title || "",
                    spaceId: c.spaceId,
                    labelIds: c.labelIds,
                    order: (index + 1) * this.ORDER_STEP,
                    createdAt: Date.now(),
                  }),
                )
              }
            }),
          )
        }
      } else if (position === "END") {
        const lastCollection = await db.collections
          .where("[spaceId+order]")
          .between(
            [collection.spaceId, Dexie.minKey],
            [collection.spaceId, Dexie.maxKey],
          )
          .last()
        result = await this.addWithUid((uid) =>
          db.collections.add({
            uid,
            title: collection.title || "",
            spaceId: collection.spaceId,
            labelIds: collection.labelIds,
            order: lastCollection
              ? lastCollection.order + this.ORDER_STEP
              : 1000,
            createdAt: Date.now(),
          }),
        )
      }
    })
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
    if (oldIndex === newIndex) return
    await db.transaction("rw", db.collections, async () => {
      const currentCollection = await db.collections.get(collectionId)
      if (!currentCollection) return
      const allCollections = await db.collections
        .where({ spaceId: currentCollection.spaceId })
        .sortBy("order")
      const filtered = allCollections.filter((c) => c.id !== collectionId)
      const prev = newIndex > 0 ? filtered[newIndex - 1] : null
      const next = newIndex < filtered.length ? filtered[newIndex] : null
      const newOrder = this.orderBetween(prev, next)
      if (newOrder !== null) {
        await db.collections.update(collectionId, { order: newOrder })
      } else {
        filtered.splice(newIndex, 0, currentCollection)
        await Promise.all(
          filtered.map((collection, index) =>
            db.collections.update(collection.id, {
              order: (index + 1) * this.ORDER_STEP,
            }),
          ),
        )
      }
    })
    this.notifyModify("collections")
  }

  async moveCollectionToSpace(collectionId: number, targetSpaceId: number) {
    await db.transaction("rw", db.collections, async () => {
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
    })
    this.notifyModify("collections")
  }

  async getLabels() {
    return db.labels.toArray()
  }

  async addLabel(title: string, color: string) {
    const result = await this.addWithUid((uid) =>
      db.labels.add({ uid, title, color }),
    )
    this.notifyModify("labels")
    return result
  }

  async getOrCreateLabelWithTitle(title: string, notify = true) {
    const result = await db.transaction("rw", db.labels, async () => {
      const label = await db.labels.where("title").equals(title).first()
      if (label) return label.id
      const randomIndex = Math.floor(Math.random() * COLOR_LIST.length)
      return (await this.addWithUid((uid) =>
        db.labels.add({
          uid,
          title,
          color: COLOR_LIST[randomIndex],
        }),
      )) as number
    })
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
    await db.transaction("rw", db.labels, db.collections, async () => {
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
      await db.labels.delete(id)
    })
    this.notifyModify("labels")
    this.notifyModify("collections")
  }

  async updateLabel(id: number, title: string, color?: string) {
    const result = await db.labels.update(id, {
      title,
      ...(color && { color }),
    })
    this.notifyModify("labels")
    return result
  }

  async addCard(
    card: Omit<Card, "id" | "uid" | "order">,
    targetIndex?: number,
  ) {
    const result = await db.transaction("rw", db.cards, async () => {
      const cards = await db.cards
        .where("[collectionId+order]")
        .between(
          [card.collectionId, Dexie.minKey],
          [card.collectionId, Dexie.maxKey],
        )
        .toArray()

      const baseRecord = {
        title: card.title || "",
        url: card.url || "",
        collectionId: card.collectionId,
        faviconId: card.faviconId,
        description: "",
        createdAt: Date.now(),
      }

      // 没指定位置 / 集合为空 / targetIndex 在尾部 → 直接追加，1 次写
      if (
        typeof targetIndex === "undefined" ||
        cards.length === 0 ||
        targetIndex >= cards.length
      ) {
        const lastOrder = cards.length > 0 ? cards[cards.length - 1].order : 0
        return await this.addWithUid((uid) =>
          db.cards.add({
            ...baseRecord,
            uid,
            order: lastOrder + this.ORDER_STEP,
          }),
        )
      }

      // 在中间插入：用相邻 prev / next 的中间值，1 次写
      const prev = targetIndex > 0 ? cards[targetIndex - 1] : null
      const next = cards[targetIndex]
      const midOrder = this.orderBetween(prev, next)
      if (midOrder !== null) {
        return await this.addWithUid((uid) =>
          db.cards.add({ ...baseRecord, uid, order: midOrder }),
        )
      }

      // 密度过低 → 整组 rebalance 兜底
      const newOrderAtIdx = (targetIndex + 1) * this.ORDER_STEP
      await Promise.all(
        cards.slice(targetIndex).map(async (existingCard, index) => {
          await db.cards.update(existingCard.id, {
            order: newOrderAtIdx + (index + 1) * this.ORDER_STEP,
          })
        }),
      )
      return await this.addWithUid((uid) =>
        db.cards.add({
          ...baseRecord,
          uid,
          order: newOrderAtIdx,
        }),
      )
    })
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
    if (oldIndex === newIndex) return
    await db.transaction("rw", db.cards, async () => {
      const currentCard = await db.cards.get(cardId)
      if (!currentCard) return
      const allCards = await db.cards
        .where("[collectionId+order]")
        .between(
          [currentCard.collectionId, Dexie.minKey],
          [currentCard.collectionId, Dexie.maxKey],
        )
        .toArray()
      const filtered = allCards.filter((c) => c.id !== cardId)
      const prev = newIndex > 0 ? filtered[newIndex - 1] : null
      const next = newIndex < filtered.length ? filtered[newIndex] : null
      const newOrder = this.orderBetween(prev, next)
      if (newOrder !== null) {
        await db.cards.update(cardId, { order: newOrder })
      } else {
        filtered.splice(newIndex, 0, currentCard)
        await Promise.all(
          filtered.map((card, index) =>
            db.cards.update(card.id, {
              order: (index + 1) * this.ORDER_STEP,
            }),
          ),
        )
      }
    })
    this.notifyModify("cards")
  }

  async moveCardToCollection(
    cardId: number,
    targetCollectionId: number,
    targetIndex?: number,
  ) {
    await db.transaction("rw", db.cards, async () => {
      const currentCard = await db.cards.get(cardId)
      if (!currentCard) return

      const targetCards = await db.cards
        .where("[collectionId+order]")
        .between(
          [targetCollectionId, Dexie.minKey],
          [targetCollectionId, Dexie.maxKey],
        )
        .toArray()

      // 跨 collection：currentCard 不在 targetCards 中，无需 filter
      if (
        typeof targetIndex === "undefined" ||
        targetIndex >= targetCards.length
      ) {
        const lastOrder =
          targetCards.length > 0 ? targetCards[targetCards.length - 1].order : 0
        await db.cards.update(cardId, {
          collectionId: targetCollectionId,
          order: lastOrder + this.ORDER_STEP,
        })
        return
      }

      const prev = targetIndex > 0 ? targetCards[targetIndex - 1] : null
      const next = targetCards[targetIndex]
      const newOrder = this.orderBetween(prev, next)
      if (newOrder !== null) {
        await db.cards.update(cardId, {
          collectionId: targetCollectionId,
          order: newOrder,
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
    })
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

  async batchAddCards(cards: Omit<Card, "id" | "uid">[], notify = true) {
    const result = await db.cards.bulkAdd(
      cards.map((card) => ({ ...card, uid: createEntityUid() })),
    )
    if (notify) this.notifyModify("cards")
    return result
  }

  async addFavicon(url: string | undefined, notify = true) {
    if (!url) return
    const _url = url.trim()
    const result = await db.transaction("rw", db.favicons, async () => {
      const isExist = await db.favicons.where("url").equals(_url).first()
      if (isExist) return isExist.id
      return await this.addWithUid((uid) => db.favicons.add({ uid, url: _url }))
    })
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
    const spaceUidById = new Map(spaces.map((space) => [space.id, space.uid]))
    const collectionUidById = new Map(
      collections.map((collection) => [collection.id, collection.uid]),
    )
    const labelUidById = new Map(labels.map((label) => [label.id, label.uid]))
    const faviconUidById = new Map(
      favicons.map((favicon) => [favicon.id, favicon.uid]),
    )
    const identityTable = <T extends { id: number; uid: EntityUid }>(
      entities: T[],
    ) =>
      Object.fromEntries(
        entities.map((entity) => [String(entity.id), entity.uid]),
      )

    return {
      spaces: spaces.map((space) => ({
        id: space.id,
        uid: space.uid,
        title: space.title,
        icon: space.icon,
        order: space.order,
        createdAt: space.createdAt,
      })),
      collections: collections.map((collection) => ({
        id: collection.id,
        uid: collection.uid,
        title: collection.title,
        spaceId: collection.spaceId,
        spaceUid: spaceUidById.get(collection.spaceId),
        order: collection.order,
        labelIds: collection.labelIds,
        labelUids: collection.labelIds
          .map((labelId) => labelUidById.get(labelId))
          .filter((uid): uid is EntityUid => uid !== undefined),
        createdAt: collection.createdAt,
      })),
      labels: labels.map((label) => ({
        id: label.id,
        uid: label.uid,
        title: label.title,
        color: label.color,
      })),
      cards: cards.map((card) => ({
        id: card.id,
        uid: card.uid,
        title: card.title,
        url: card.url,
        order: card.order,
        faviconId: card.faviconId,
        description: card.description,
        collectionId: card.collectionId,
        collectionUid: collectionUidById.get(card.collectionId),
        faviconUid:
          card.faviconId === undefined
            ? undefined
            : faviconUidById.get(card.faviconId),
        createdAt: card.createdAt,
      })),
      favicons: favicons.map((favicon) => ({
        id: favicon.id,
        uid: favicon.uid,
        url: favicon.url,
      })),
      identity: {
        schemaVersion: 2 as const,
        tables: {
          spaces: identityTable(spaces),
          collections: identityTable(collections),
          labels: identityTable(labels),
          cards: identityTable(cards),
          favicons: identityTable(favicons),
        },
      },
    }
  }

  private stripMetadata<
    T extends { createdAt?: number; id?: number; uid?: EntityUid },
  >(obj: T, additionalFields: (keyof T)[] = []): Partial<T> {
    const { createdAt: _, id: _id, uid: _uid, ...rest } = obj
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

  private normalizeSyncData(
    data: SyncData,
    existing: {
      spaces: Space[]
      collections: Collection[]
      labels: Label[]
      cards: Card[]
      favicons: Favicon[]
    },
  ) {
    const existingUids: Record<TableName, Map<number, EntityUid>> = {
      spaces: new Map(existing.spaces.map((item) => [item.id, item.uid])),
      collections: new Map(
        existing.collections.map((item) => [item.id, item.uid]),
      ),
      labels: new Map(existing.labels.map((item) => [item.id, item.uid])),
      cards: new Map(existing.cards.map((item) => [item.id, item.uid])),
      favicons: new Map(existing.favicons.map((item) => [item.id, item.uid])),
    }
    const usedUids = new Set<EntityUid>()

    const resolveUid = (
      table: TableName,
      id: number,
      incomingUid: unknown,
    ): EntityUid => {
      const identityUid = data.identity?.tables?.[table]?.[String(id)]
      if (
        isEntityUid(incomingUid) &&
        isEntityUid(identityUid) &&
        incomingUid !== identityUid
      ) {
        throw new Error(`importData: identity mismatch for ${table}:${id}`)
      }
      const uid = [identityUid, incomingUid, existingUids[table].get(id)].find(
        isEntityUid,
      )
      if (uid) {
        if (usedUids.has(uid)) {
          throw new Error(`importData: duplicate uid ${uid}`)
        }
        usedUids.add(uid)
        return uid
      }

      let generatedUid = createEntityUid()
      while (usedUids.has(generatedUid)) generatedUid = createEntityUid()
      usedUids.add(generatedUid)
      return generatedUid
    }

    const spaces: Space[] = (data.spaces || []).map((space) => ({
      ...space,
      uid: resolveUid("spaces", space.id, space.uid),
    }))
    const collections: Collection[] = (data.collections || []).map(
      ({ spaceUid: _spaceUid, labelUids: _labelUids, ...collection }) => ({
        ...collection,
        uid: resolveUid("collections", collection.id, collection.uid),
      }),
    )
    const labels: Label[] = (data.labels || []).map((label) => ({
      ...label,
      uid: resolveUid("labels", label.id, label.uid),
    }))
    const cards: Card[] = (data.cards || []).map(
      ({
        collectionUid: _collectionUid,
        faviconUid: _faviconUid,
        ...card
      }) => ({
        ...card,
        uid: resolveUid("cards", card.id, card.uid),
      }),
    )
    const favicons: Favicon[] = (data.favicons || []).map((favicon) => ({
      ...favicon,
      uid: resolveUid("favicons", favicon.id, favicon.uid),
    }))

    return { spaces, collections, labels, cards, favicons }
  }

  async importData(data: SyncData) {
    if (!data || typeof data !== "object") {
      throw new Error("importData: invalid data payload")
    }

    const tablesToLock: Dexie.Table[] = [
      db.spaces,
      db.collections,
      db.labels,
      db.cards,
      db.favicons,
    ]
    // 注意：不再 try/catch 吞掉错误。事务失败时会自动回滚，
    // 调用方需要据此感知失败、避免误把 LOCAL_LAST_DOWNLOAD_TIME 等元信息落库。
    await db.transaction("rw", tablesToLock, async () => {
      const [spaces, collections, labels, cards, favicons] = await Promise.all([
        db.spaces.toArray(),
        db.collections.toArray(),
        db.labels.toArray(),
        db.cards.toArray(),
        db.favicons.toArray(),
      ])
      const normalized = this.normalizeSyncData(data, {
        spaces,
        collections,
        labels,
        cards,
        favicons,
      })

      await Promise.all([
        db.spaces.clear(),
        db.collections.clear(),
        db.labels.clear(),
        db.cards.clear(),
        db.favicons.clear(),
      ])
      const chunkSize = 100
      if (normalized.spaces.length > 0) {
        await db.spaces.bulkPut(normalized.spaces)
      }
      if (normalized.collections.length > 0) {
        await db.collections.bulkPut(normalized.collections)
      }
      if (normalized.labels.length > 0) {
        await db.labels.bulkPut(normalized.labels)
      }
      let faviconsToImport: Favicon[] = []
      if (normalized.cards.length > 0 && normalized.favicons.length > 0) {
        const usedFaviconIds = new Set<number>()
        normalized.cards.forEach((card) => {
          if (card.faviconId && card.faviconId > 0) {
            usedFaviconIds.add(card.faviconId)
          }
        })
        faviconsToImport = normalized.favicons.filter((favicon) =>
          usedFaviconIds.has(favicon.id),
        )
      } else {
        faviconsToImport =
          normalized.cards.length === 0 ? normalized.favicons : []
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

      if (normalized.cards.length > 0) {
        const numChunks = Math.ceil(normalized.cards.length / chunkSize)
        for (let i = 0; i < numChunks; i++) {
          const start = i * chunkSize
          const end = start + chunkSize
          const chunk = normalized.cards.slice(start, end)
          await db.cards.bulkPut(chunk)
        }
      }
    })
  }

  async importFromToby(lists: CollectionWithCards[]) {
    await db.transaction(
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
    await db.transaction(
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
            const cards: Omit<Card, "id" | "uid">[] = []
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
