export interface TobyImportCard {
  title: string
  url: string
  customTitle?: string
  customDescription?: string
  description?: string
  favIconUrl?: string
}

export interface TobyImportList {
  title: string
  cards: TobyImportCard[]
  labels: { title: string }[]
}

export interface TobyImportSpace {
  title: string
  lists: TobyImportList[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getLabelTitle(value: unknown) {
  if (typeof value === "string") return value
  if (!isRecord(value)) return
  if (typeof value.title === "string") return value.title
  if (typeof value.name === "string") return value.name
}

function normalizeCard(value: unknown): TobyImportCard | undefined {
  if (!isRecord(value) || typeof value.url !== "string") return

  return {
    title: typeof value.title === "string" ? value.title : value.url,
    url: value.url,
    ...(typeof value.customTitle === "string" && {
      customTitle: value.customTitle,
    }),
    ...(typeof value.customDescription === "string" && {
      customDescription: value.customDescription,
    }),
    ...(typeof value.description === "string" && {
      description: value.description,
    }),
    ...(typeof value.favIconUrl === "string" && {
      favIconUrl: value.favIconUrl,
    }),
  }
}

function normalizeList(
  value: unknown,
  labelsById: Record<string, unknown>,
): TobyImportList | undefined {
  if (
    !isRecord(value) ||
    typeof value.title !== "string" ||
    !Array.isArray(value.cards)
  ) {
    return
  }

  const labels = Array.isArray(value.labels)
    ? value.labels
        .map(getLabelTitle)
        .filter((title): title is string => Boolean(title))
    : Array.isArray(value.labelIds)
      ? value.labelIds
          .map((id) => getLabelTitle(labelsById[String(id)]))
          .filter((title): title is string => Boolean(title))
      : []

  return {
    title: value.title,
    cards: value.cards
      .map(normalizeCard)
      .filter((card): card is TobyImportCard => Boolean(card)),
    labels: labels.map((title) => ({ title })),
  }
}

export function normalizeTobyExport(data: unknown): TobyImportSpace[] {
  if (!isRecord(data)) return []

  const labelsById = isRecord(data.labels) ? data.labels : {}

  if (Array.isArray(data.lists)) {
    const lists = data.lists
      .map((list) => normalizeList(list, labelsById))
      .filter((list): list is TobyImportList => Boolean(list))
    return lists.length > 0 ? [{ title: "From Toby", lists }] : []
  }

  if (!Array.isArray(data.groups)) return []

  return data.groups
    .map((group) => {
      if (!isRecord(group) || !Array.isArray(group.lists)) return
      const lists = group.lists
        .map((list) => normalizeList(list, labelsById))
        .filter((list): list is TobyImportList => Boolean(list))
      if (lists.length === 0) return
      return {
        title: typeof group.name === "string" ? group.name : "From Toby",
        lists,
      }
    })
    .filter((space): space is TobyImportSpace => Boolean(space))
}
