import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import type { layoutMode } from "@/type"

export const useLayoutStore = defineStore("Layout", () => {
  const leftLayoutMode = useLocalStorage<layoutMode>("leftLayoutMode", "expand")
  const rightLayoutMode = useLocalStorage<layoutMode>(
    "rightLayoutMode",
    "expand",
  )

  const leftLayoutHovering = ref<boolean>(false)
  const rightLayoutHovering = ref<boolean>(false)

  const onUpdateLayoutHovering = (
    hovering: boolean,
    side: "left" | "right",
  ) => {
    if (side === "left") {
      leftLayoutHovering.value = hovering
    } else {
      rightLayoutHovering.value = hovering
    }
  }

  const onUpdateLayoutMode = (mode: layoutMode, side: "left" | "right") => {
    if (side === "left") {
      leftLayoutMode.value = mode
    } else {
      rightLayoutMode.value = mode
    }
  }

  const isLeftCollapsed = computed(() => {
    return (
      leftLayoutMode.value === "collapse" ||
      (leftLayoutMode.value === "hover" && !leftLayoutHovering.value)
    )
  })
  const isRightCollapsed = computed(() => {
    return (
      rightLayoutMode.value === "collapse" ||
      (rightLayoutMode.value === "hover" && !rightLayoutHovering.value)
    )
  })

  return {
    leftLayoutMode,
    rightLayoutMode,
    leftLayoutHovering,
    rightLayoutHovering,
    onUpdateLayoutHovering,
    onUpdateLayoutMode,
    isLeftCollapsed,
    isRightCollapsed,
  }
})
