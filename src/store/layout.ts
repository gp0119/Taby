import { defineStore } from "pinia"

export const useLayoutStore = defineStore("Layout", () => {
  const layout = ref<"leftMenu" | "topMenu">("leftMenu")
  const leftAsideCollapsed = ref(true)
  const rightAsideCollapsed = ref(true)
  const leftAsideWidth = ref(200)
  const rightAsideWidth = ref(200)
  const MIN_WIDTH = 150
  const MAX_WIDTH = 300

  const onUpdateLayout = (_layout: "leftMenu" | "topMenu") => {
    layout.value = _layout
  }
  const onUpdateLeftAsideCollapsed = (collapsed: boolean) => {
    leftAsideCollapsed.value = collapsed
  }
  const onUpdateRightAsideCollapsed = (collapsed: boolean) => {
    rightAsideCollapsed.value = collapsed
  }
  const onUpdateLeftAsideWidth = (width: number) => {
    leftAsideWidth.value = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
  }
  const onUpdateRightAsideWidth = (width: number) => {
    rightAsideWidth.value = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
  }

  return {
    layout,
    leftAsideCollapsed,
    rightAsideCollapsed,
    leftAsideWidth,
    rightAsideWidth,
    onUpdateLayout,
    onUpdateLeftAsideCollapsed,
    onUpdateRightAsideCollapsed,
    onUpdateLeftAsideWidth,
    onUpdateRightAsideWidth,
  }
})
