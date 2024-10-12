export interface iCard {
  title: string;
  url: string;
  customTitle?: string;
  customDescription?: string;
  windowId?: number;
  id?: number | undefined;
  oldIndex?: number;
}

export interface iLabel {
  title: string;
  color: string;
}

export interface iCollection {
  title: string;
  cards: iCard[];
  labels?: iLabel[];
}

export interface iCollections {
  title: string;
  collections: iCollection[];
}
