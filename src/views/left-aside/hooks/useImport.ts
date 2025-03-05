import { Card, CollectionWithCards, Label } from "@/type.ts"
import DanaManager from "@/db"
import { useMessage } from "naive-ui"

const dataManager = new DanaManager()
async function batchAddLable(labels: Label[]) {
  const labelIds: number[] = []
  for (const label of labels) {
    const labelId = await dataManager.getOrCreateLabelWithTitle(label.title)
    if (labelId) {
      labelIds.push(labelId)
    }
  }
  return labelIds
}

async function batchAddCard(cards: Card[], collectionId: number) {
  await dataManager.batchAddCards(
    cards.map((card, index) => {
      return {
        ...card,
        customTitle: card.customTitle || card.title,
        customDescription: card.customDescription || card.title,
        collectionId,
        order: (index + 1) * 1000,
      }
    }),
  )
}

async function addCollection(
  collection: CollectionWithCards,
  spaceId: number,
  labelIds: number[],
) {
  return dataManager.addCollection({
    title: collection.title,
    spaceId: spaceId,
    labelIds,
  })
}

export function useImport() {
  const message = useMessage()
  const importFromToby = async (spaceId: number, file: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = async (event) => {
        try {
          const lists: {
            lists: CollectionWithCards[]
          } = JSON.parse(event.target?.result as string)
          for (const list of lists.lists) {
            const labelIds: number[] = await batchAddLable(list.labels)
            const collectionId = (await addCollection(
              list,
              spaceId,
              labelIds,
            )) as number
            await batchAddCard(list.cards, collectionId)
          }
          resolve(true)
        } catch (error) {
          reject(error)
          message.error("文件内容不是有效的 JSON")
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
          for (const space of spaces) {
            const spaceId = await dataManager.addSpace(space)
            for (const collection of space.collections) {
              const labelIds: number[] = await batchAddLable(collection.labels)
              const collectionId = (await addCollection(
                space,
                spaceId,
                labelIds,
              )) as number
              await batchAddCard(collection.cards, collectionId)
            }
          }
          resolve(true)
        } catch (error) {
          reject(error)
          message.error("文件内容不是有效的 JSON")
        }
      }
    })
  }

  return {
    importFromToby,
    importFromTaby,
  }
}
