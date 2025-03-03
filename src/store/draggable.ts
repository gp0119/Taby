import { useSortStore } from "@/store/sort.ts"
import { useTagsStore } from "@/store/tags.ts"
import { defineStore } from "pinia"

export const useDraggableStore = defineStore("draggable", () => {
  const tagStore = useTagsStore()
  const sortStore = useSortStore()
  const draggable: Ref<boolean> = ref(false)

  function setDraggable(value: boolean) {
    if (value) {
      tagStore.resetSelectedTag()
      sortStore.resetSort()
    }
    draggable.value = value
  }

  return {
    draggable,
    setDraggable,
  }
})
