interface BaseEntity {
  id: number
  createdAt?: number
  modifiedAt?: number
}

export interface iCard extends BaseEntity {
  title: string
  url: string
  description: string
  faviconId?: number
  windowId?: number
  oldIndex?: number
}

export interface Space extends BaseEntity {
  title: string
  order: number
  icon?: string
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
  description: string
  collectionId: number
  order: number
  windowId?: number
  faviconId?: number
}

export interface CollectionWithCards extends Collection {
  cards: CardWithFavicon[]
  labels: Label[]
}

export interface Favicon {
  id: number
  url: string
}

export interface CardWithFavicon extends Card {
  favicon: string | null
}

export interface SyncData {
  spaces: Space[]
  collections: Collection[]
  labels: Label[]
  cards: Card[]
}

export interface iOption {
  label: string
  value: number
}
export type iOptions = iOption[]
export type movePosition = "HEAD" | "END"
