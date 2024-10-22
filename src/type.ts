import Dexie, { type EntityTable } from "dexie"

export interface iCard {
  title: string
  url: string
  customTitle?: string
  customDescription?: string
  windowId?: number
  id?: number | undefined
  oldIndex?: number
}

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
  windowId?: number
}

export interface CollectionWithCards extends Collection {
  cards: Card[]
}

export type TabbyDatabase = Dexie & {
  spaces: EntityTable<Space, "id">
  collections: EntityTable<Collection, "id">
  labels: EntityTable<Label, "id">
  cards: EntityTable<Card, "id">
}
