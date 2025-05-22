import { defineStore } from "pinia"

export const useLayoutStore = defineStore("Layout", () => {
  const layout = ref<"leftMenu" | "topMenu">("leftMenu")

  const leftAsideCollapsed = ref(true)
  const rightAsideCollapsed = ref(true)

  const leftAsidePinned = ref(false)
  const rightAsidePinned = ref(false)
  const onUpdateLayout = (_layout: "leftMenu" | "topMenu") => {
    layout.value = _layout
  }
  const onUpdateLeftAsideCollapsed = (collapsed: boolean) => {
    leftAsideCollapsed.value = collapsed
  }
  const onUpdateRightAsideCollapsed = (collapsed: boolean) => {
    rightAsideCollapsed.value = collapsed
  }
  const onUpdateLeftAsidePinned = (pinned: boolean) => {
    leftAsidePinned.value = pinned
  }
  const onUpdateRightAsidePinned = (pinned: boolean) => {
    rightAsidePinned.value = pinned
  }

  return {
    layout,
    leftAsideCollapsed,
    rightAsideCollapsed,
    leftAsidePinned,
    rightAsidePinned,
    onUpdateLayout,
    onUpdateLeftAsideCollapsed,
    onUpdateRightAsideCollapsed,
    onUpdateLeftAsidePinned,
    onUpdateRightAsidePinned,
  }
})
