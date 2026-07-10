export type EntityUid = string

interface BaseEntity {
  id: number
  uid: EntityUid
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
  customTitle?: string
  customDescription?: string
  url: string
  description: string
  collectionId: number
  order: number
  windowId?: number
  faviconId?: number
  favicon?: string
}

export type CardView = Omit<Card, "uid"> & { uid?: EntityUid }

export interface CollectionWithCards extends Collection {
  cards: Card[]
  labels: Label[]
}

export interface SpaceWithCollections extends Space {
  collections: Collection[]
}

export interface Favicon extends BaseEntity {
  url: string
}

export type SyncSpace = Omit<Space, "uid"> & { uid?: EntityUid }
export type SyncLabel = Omit<Label, "uid"> & { uid?: EntityUid }
export type SyncFavicon = Omit<Favicon, "uid"> & { uid?: EntityUid }

export type SyncCollection = Omit<Collection, "uid"> & {
  uid?: EntityUid
  spaceUid?: EntityUid
  labelUids?: EntityUid[]
}

export type SyncCard = Omit<Card, "uid"> & {
  uid?: EntityUid
  collectionUid?: EntityUid
  faviconUid?: EntityUid
}

export type SyncIdentityTable = Record<string, EntityUid>

export interface SyncIdentityRegistry {
  schemaVersion: 2
  tables: {
    spaces: SyncIdentityTable
    collections: SyncIdentityTable
    labels: SyncIdentityTable
    cards: SyncIdentityTable
    favicons: SyncIdentityTable
  }
}

export interface SyncData {
  spaces: SyncSpace[]
  collections: SyncCollection[]
  labels: SyncLabel[]
  cards: SyncCard[]
  favicons: SyncFavicon[]
  identity?: SyncIdentityRegistry
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
export type layoutMode = "collapse" | "expand" | "hover"

export type iSetting = {
  language: "zh-CN" | "en-US"
  theme: "light" | "dark"
  openInNewWindow: boolean
  rememberScrollPosition: boolean
  hideRightClickMenu: boolean
  saveAfterOperationTime: number
  openCardsInGroup: boolean
  shortcutSettings: {
    saveAllTabs: string
    saveAllTabsAndClose: string
    closeDuplicateTabs: string
    closeAllTabs: string
    globalSearch: string
    openTagFilter: string
  }
}

export interface ExportSpace {
  title: string
  icon: string
  collections: {
    title: string
    labels: {
      title: string
      color: string
    }[]
    cards: {
      title: string
      url: string
      description: string
      favicon: string
    }[]
  }[]
}

export interface GistVersion {
  version: string
  committedAt: string
  url: string
}
