import { defineStore } from "pinia"

export const useDraggableStore = defineStore("draggable", () => {
  const draggable: Ref<boolean> = ref(false)

  function setDraggable(value: boolean) {
    draggable.value = value
  }

  return {
    draggable,
    setDraggable,
  }
})
