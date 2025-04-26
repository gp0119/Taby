interface BaseEntity {
  id: string
  createdAt?: number
  modifiedAt?: number
}

export interface iCard extends BaseEntity {
  title: string
  url: string
  description: string
  faviconId?: string
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
  id: string
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
  value: string
}
export interface SyncTokenData {
  accessToken: string | undefined
  gistId: string | undefined
}
export type iOptions = iOption[]
export type movePosition = "HEAD" | "END"

export interface ChromeTabInfo {
  title: string
  url: string
  description: string
  windowId: number
  id: number | undefined // 使用 number | undefined
  collectionId: string // 这个字段可能不需要，或者保持为空
  order: number
  favicon: string
}
