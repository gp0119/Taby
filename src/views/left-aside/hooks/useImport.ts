import dataManager from "@/db"
import { Card, CollectionWithCards, Label } from "@/type.ts"
import { useMessage } from "naive-ui"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"

async function batchAddLable(labels: Label[]) {
  const labelIds: string[] = []
  for (const label of labels) {
    const labelId = await dataManager.getOrCreateLabelWithTitle(label.title)
    if (labelId) {
      labelIds.push(labelId)
    }
  }
  return labelIds
}

async function batchAddCard(cards: Card[], collectionId: string) {
  await dataManager.batchAddCards(
    cards.map((card, index) => {
      return {
        title: card.customTitle || card.title,
        url: card.url,
        faviconId: card.faviconId,
        description: card.customDescription || card.description || "",
        collectionId,
        order: (index + 1) * 1000,
        createdAt: Date.now(),
      }
    }),
  )
}

async function addCollection(
  collection: CollectionWithCards,
  spaceId: string,
  labelIds: string[],
) {
  return dataManager.addCollection({
    title: collection.title,
    spaceId: spaceId,
    labelIds,
  })
}

export function useImport() {
  const message = useMessage()
  const { ft } = useHelpi18n()
  const importFromToby = async (file: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = async (event) => {
        try {
          const lists: {
            lists: CollectionWithCards[]
          } = JSON.parse(event.target?.result as string)
          if (!lists.lists || !lists.lists.length) {
            throw new Error(ft("invalid-file", "Toby"))
          }
          const spaceId = await dataManager.addSpace({
            title: "From Toby",
            icon: "StorefrontOutline",
          })
          for (const list of lists.lists) {
            const labelIds: string[] = await batchAddLable(list.labels)
            const collectionId = (await addCollection(
              list,
              spaceId,
              labelIds,
            )) as string
            await batchAddCard(list.cards, collectionId)
          }
          resolve(true)
        } catch (error) {
          reject(error)
          message.error(ft("invalid-file", "Toby"))
        }
      }
    })
  }

  const importFromTaby = async (file: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = async (event) => {
        try {
          const spaces = JSON.parse(event.target?.result as string)
          if (!spaces || !spaces.length) {
            throw new Error(ft("invalid-file", "Taby"))
          }
          for (const space of spaces) {
            const spaceId = await dataManager.addSpace({
              title: space.title,
              icon: space.icon,
            })
            for (const collection of space.collections) {
              const labelIds: string[] = await batchAddLable(collection.labels)
              const collectionId = (await addCollection(
                collection,
                spaceId,
                labelIds,
              )) as string
              for (const card of collection.cards) {
                if (card.favicon) {
                  card.faviconId = await dataManager.addFavicon(card.favicon)
                }
              }
              await batchAddCard(collection.cards, collectionId)
            }
          }
          resolve(true)
        } catch (error) {
          reject(error)
          message.error(ft("invalid-file", "Taby"))
        }
      }
    })
  }

  return {
    importFromToby,
    importFromTaby,
  }
}
