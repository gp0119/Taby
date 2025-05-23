import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"

export const useLayoutStore = defineStore("Layout", () => {
  const layout = ref<"leftMenu" | "topMenu">("leftMenu")

  const leftAsideCollapsed = useLocalStorage<boolean>(
    "leftAsideCollapsed",
    true,
  )
  const rightAsideCollapsed = useLocalStorage<boolean>(
    "rightAsideCollapsed",
    false,
  )

  const leftAsidePinned = ref(false)
  const rightAsidePinned = ref(true)

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
