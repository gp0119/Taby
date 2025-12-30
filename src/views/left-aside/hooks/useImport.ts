import dataManager from "@/db"
import { CollectionWithCards } from "@/type.ts"
import { useMessage } from "naive-ui"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"

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
            throw new Error(ft("invalid-file", "toby"))
          }
          await dataManager.importFromToby(lists.lists)
          resolve(true)
        } catch (error) {
          reject(error)
          message.error(ft("invalid-file", "toby"))
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
            throw new Error(ft("invalid-file", "taby"))
          }
          await dataManager.importFromTaby(spaces)
          resolve(true)
        } catch (error) {
          reject(error)
          message.error(ft("invalid-file", "taby"))
        }
      }
    })
  }

  return {
    importFromToby,
    importFromTaby,
  }
}
