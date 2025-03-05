import { CollectionWithCards } from "@/type.ts"
import DanaManager from "@/db"
import { useMessage } from "naive-ui"
import { Card, Collection, Label, Space } from "@/type.ts"

export function useImport() {
  const dataManager = new DanaManager()
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
            const labelIds: number[] = []
            await Promise.all(
              list.labels.map(async (item) => {
                const labelId = await dataManager.getOrCreateLabelWithTitle(
                  item.title,
                )
                if (labelId) {
                  labelIds.push(labelId)
                }
              }),
            )
            const collectionId = (await dataManager.addCollection({
              title: list.title,
              spaceId: spaceId,
              labelIds,
            })) as number
            await dataManager.batchAddCards(
              list.cards
                .filter((item) => item.url !== "/note.html")
                .map((item, index) => {
                  return {
                    ...item,
                    customTitle: item.customTitle || item.title,
                    customDescription: item.customDescription || item.title,
                    collectionId,
                    order: (index + 1) * 1000,
                  }
                }),
            )
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
          await Promise.all(
            spaces.map(
              async (
                space: Space & {
                  collections: (Collection & {
                    cards: Card[]
                    labels: Label[]
                  })[]
                },
              ) => {
                const spaceId = await dataManager.addSpace(space)
                space.collections.map(async (collection) => {
                  const labelIds: number[] = []
                  await Promise.all(
                    collection.labels.map(async (item) => {
                      const labelId =
                        await dataManager.getOrCreateLabelWithTitle(item.title)
                      if (labelId) {
                        labelIds.push(labelId)
                      }
                    }),
                  )
                  const collectionId = (await dataManager.addCollection({
                    ...collection,
                    spaceId,
                    labelIds,
                  })) as number
                  collection.cards.map(async (card) => {
                    await dataManager.addCard({
                      ...card,
                      collectionId,
                    })
                  })
                })
              },
            ),
          )
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
