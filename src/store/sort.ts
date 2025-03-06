import { defineStore } from "pinia"
import { useLocalStorage, useToggle } from "@vueuse/core"
import { useHelpi18n } from "@/hooks/useHelpi18n"

export const useSortStore = defineStore("sort", () => {
  const sortOrder = useLocalStorage<string | null>("sortOrder", "draggable")
  const { ft } = useHelpi18n()
  const [isSortOpen, toggleSortOpen] = useToggle()
  const sortOptions = [
    { label: ft("draggable"), key: "draggable" },
    { label: ft("title-asc"), key: "title-asc" },
    { label: ft("title-desc"), key: "title-desc" },
    { label: ft("created-at-asc"), key: "created-at-asc" },
    { label: ft("created-at-desc"), key: "created-at-desc" },
  ]
  function setSortOrder(value: string) {
    sortOrder.value = value
  }

  function resetSort() {
    sortOrder.value = "draggable"
  }

  return {
    sortOrder,
    setSortOrder,
    sortOptions,
    isSortOpen,
    toggleSortOpen,
    resetSort,
  }
})
