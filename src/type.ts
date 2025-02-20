interface BaseEntity {
  id: number
  createdAt?: number
  modifiedAt?: number
}

export interface iCard extends BaseEntity {
  title: string
  url: string
  customTitle?: string
  customDescription?: string
  windowId?: number
  oldIndex?: number
}

export interface Space extends BaseEntity {
  title: string
  order: number
}

export interface Collection extends BaseEntity {
  title: string
  spaceId: number
  order: number
  labelIds: number[]
}

export interface Label extends BaseEntity {
  title: string
  color: string
}

export interface Card extends BaseEntity {
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
  labels: Label[]
}

export interface SyncData {
  spaces: Space[]
  collections: Collection[]
  labels: Label[]
  cards: Card[]
  timestamp: number
}
