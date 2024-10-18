import Dexie, { type EntityTable } from "dexie"
import { isUndef } from "@/utils/is.ts"

export interface Space {
  id: number
  title: string
  order: number
}

export interface Collection {
  id: number
  title: string
  spaceId: number
  order: number
  labelIds: number[]
}

export interface Label {
  id: number
  title: string
  color: string
}

export interface Card {
  id: number
  title: string
  url: string
  customTitle: string
  customDescription: string
  collectionId: number
  order: number
}

export interface CollectionWithCards extends Collection {
  cards: Card[]
}

type TabbyDatabase = Dexie & {
  spaces: EntityTable<Space, "id">
  collections: EntityTable<Collection, "id">
  labels: EntityTable<Label, "id">
  cards: EntityTable<Card, "id">
}

class TabbyDatabaseService {
  ORDER_STEP: number
  db: TabbyDatabase
  constructor() {
    console.log("TabbyDatabaseService")
    this.ORDER_STEP = 1000
    this.db = new Dexie("TabbyDatabase") as TabbyDatabase
    this.db.version(1).stores({
      spaces: "++id, title, order",
      collections: "++id, title, spaceId, order, labelIds",
      labels: "++id, title, color",
      cards:
        "++id, title, url, customTitle, order, customDescription, collectionId",
    })
    this.initDb()
  }

  async initDb() {
    const hasSpace = await this.db.spaces.count()
    if (!hasSpace) {
      await this.db.spaces.bulkAdd([{ title: "my collection", order: 1000 }])
    }
  }

  private async getNextOrder(
    table: Dexie.Table<any, any>,
    filter?: (item: any) => boolean,
  ) {
    let items = await table.toArray()
    if (filter) {
      items = items.filter(filter)
    }
    const maxOrder =
      items.length > 0 ? Math.max(...items.map((item) => item.order)) : 0
    return maxOrder + this.ORDER_STEP
  }

  async getAllSpaces() {
    return this.db.spaces.orderBy("order").toArray()
  }

  async addSpace(space: Omit<Space, "id" | "order">) {
    const order = await this.getNextOrder(this.db.spaces)
    return this.db.spaces.add({
      ...space,
      order,
    })
  }

  async removeSpace(id: number) {
    await this.db.transaction(
      "rw",
      this.db.spaces,
      this.db.collections,
      this.db.cards,
      async () => {
        const collectionsToDelete = await this.db.collections
          .where({ spaceId: id })
          .toArray()
        for (const collection of collectionsToDelete) {
          await this.db.cards.where({ collectionId: collection.id }).delete()
        }
        await this.db.collections.where({ spaceId: id }).delete()
        await this.db.spaces.delete(id)
      },
    )
  }

  async updateSpaceTitle(id: number, title: string) {
    return this.db.spaces.update(id, { title })
  }

  async moveSpace(id: number, targetId: number) {
    const allSpaces = await this.db.spaces.toArray()
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
        await this.db.spaces.update(space.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async addCollection(collection: Omit<Collection, "id" | "order">) {
    const newOrder = await this.getNextOrder(
      this.db.collections,
      (item) => item.spaceId === collection.spaceId,
    )
    return this.db.collections.add({
      ...collection,
      order: newOrder,
    })
  }

  async removeCollection(id: number) {
    await this.db.transaction(
      "rw",
      this.db.collections,
      this.db.cards,
      async () => {
        await this.db.cards.where("collectionId").equals(id).delete()
        await this.db.collections.delete(id)
      },
    )
  }

  async updateCollectionTitle(collectionId: number, title: string) {
    return this.db.collections.update(collectionId, { title })
  }

  async moveCollection(collectionId: number, targetId: number) {
    const currentCollection = await this.db.collections.get(collectionId)
    if (!currentCollection) return
    const allCollections = await this.db.collections
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
        await this.db.collections.update(collection.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async moveCollectionToSpace(collectionId: number, targetSpaceId: number) {
    const currentCollection = await this.db.collections.get(collectionId)
    if (!currentCollection) return
    const newOrder = await this.getNextOrder(
      this.db.collections,
      (item) => item.spaceId === targetSpaceId,
    )
    await this.db.collections.update(collectionId, {
      spaceId: targetSpaceId,
      order: newOrder,
    })
  }

  async getLabels() {
    return this.db.labels.toArray()
  }

  async addLabel(title: string, color: string) {
    return this.db.labels.add({ title, color })
  }

  async addCard(card: Pick<Card, "title" | "url" | "collectionId">) {
    const newOrder = await this.getNextOrder(
      this.db.cards,
      (item) => item.collectionId === card.collectionId,
    )
    return this.db.cards.add({
      ...card,
      order: newOrder,
      customTitle: card.title,
      customDescription: card.title,
    })
  }

  async removeCard(id: number) {
    return this.db.cards.delete(id)
  }

  updateCardTitleAndDescription(
    id: number,
    { title, description }: { title?: string; description?: string },
  ) {
    return this.db.cards.update(id, {
      customTitle: title,
      customDescription: description,
    })
  }

  async moveCard(cardId: number, targetId: number) {
    const currentCard = await this.db.cards.get(cardId)
    if (!currentCard) return
    const allCards = await this.db.cards
      .where({ collectionId: currentCard.collectionId })
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
        await this.db.cards.update(card.id, {
          order: (index + 1) * this.ORDER_STEP,
        })
      }),
    )
  }

  async moveCardToCollection(cardId: number, targetCollectionId: number) {
    const currentCard = await this.db.cards.get(cardId)
    if (!currentCard) return
    const newOrder = await this.getNextOrder(
      this.db.cards,
      (item) => item.collectionId === targetCollectionId,
    )
    await this.db.cards.update(cardId, {
      collectionId: targetCollectionId,
      order: newOrder,
    })
  }

  async getCollectionWithCards(
    spaceId: number,
  ): Promise<CollectionWithCards[]> {
    const collections = await this.db.collections
      .where({ spaceId })
      .sortBy("order")
    return await Promise.all(
      collections.map(async (collection) => {
        const cards = await this.db.cards
          .where({ collectionId: collection.id })
          .sortBy("order")
        return { ...collection, cards }
      }),
    )
  }
}

export default new TabbyDatabaseService()
