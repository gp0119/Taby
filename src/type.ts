interface BaseEntity {
  id: number
  uid: string
  createdAt?: number
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
  spaceId: string
  order: number
  labelIds: string[]
  icon?: string
}

export interface Label extends BaseEntity {
  title: string
  color: string
}

export interface Card extends BaseEntity {
  title: string
  customTitle?: string
  customDescription?: string
  url: string
  description: string
  collectionId: string
  order: number
  windowId?: number
  faviconId?: string
  favicon?: string
}

export interface CollectionWithCards extends Collection {
  cards: Card[]
  labels: Label[]
}

export interface SpaceWithCollections extends Space {
  collections: Collection[]
}

export interface Favicon {
  id: number
  uid: string
  url: string
}

export interface SyncData {
  spaces: Space[]
  collections: Collection[]
  labels: Label[]
  cards: Card[]
  favicons: Favicon[]
}

export interface iOption {
  label: string
  value: number
}
export interface SyncTokenData {
  accessToken: string | undefined
  gistId: string | undefined
}
export type iOptions = iOption[]
export type movePosition = "HEAD" | "END"
