import { defineStore } from "pinia"
import { useLocalStorage, useToggle } from "@vueuse/core"

export const useSortStore = defineStore("sort", () => {
  const sort = useLocalStorage<string | null>("sort", "Draggable")
  const order = useLocalStorage<string | null>("order", null)
  const [isSortOpen, toggleSortOpen] = useToggle()
  const sortOptions = [
    { label: "Draggable", key: "Draggable" },
    { label: "A-Z", key: "Title-asc" },
    { label: "Z-A", key: "Title-desc" },
    { label: "CreatedAt", key: "CreatedAt-asc" },
    { label: "CreatedAt", key: "CreatedAt-desc" },
  ]
  function setSort(value: string) {
    sort.value = value
  }

  function setOrder(value: string) {
    order.value = value
  }

  const combineSort = computed(() => {
    return `${sort.value}-${order.value}`
  })

  function resetSort() {
    sort.value = "Draggable"
    order.value = null
  }

  return {
    sort,
    order,
    sortOptions,
    setSort,
    setOrder,
    combineSort,
    isSortOpen,
    toggleSortOpen,
    resetSort,
  }
})
