import { useSortStore } from "@/store/sort.ts"
import { useTagsStore } from "@/store/tags.ts"
import { defineStore } from "pinia"
import { useDuplicateCardStore } from "@/store/duplicate-card"
export const useDraggableStore = defineStore("draggable", () => {
  const tagStore = useTagsStore()
  const sortStore = useSortStore()
  const duplicateCardStore = useDuplicateCardStore()
  const draggable: Ref<boolean> = ref(false)

  function setDraggable(value: boolean) {
    if (value) {
      tagStore.resetSelectedTag()
      sortStore.resetSort()
      duplicateCardStore.clearDuplicateCards()
    }
    draggable.value = value
  }

  return {
    draggable,
    setDraggable,
  }
})
