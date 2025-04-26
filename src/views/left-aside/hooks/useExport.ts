import { db } from "@/db/database.ts"

export function useExport() {
  const download = (data: any) => {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const date = new Date().toLocaleDateString().replace(/\//g, "-")
    a.download = `taby-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportFromTaby = async (spaceIds: string[]) => {
    const data = await db.exportBySpaceId(spaceIds)
    download(data)
  }

  return {
    exportFromTaby,
  }
}
