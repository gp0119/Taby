import { defineStore } from "pinia"

export const useLayoutStore = defineStore("Layout", () => {
  const layout = ref<"leftMenu" | "topMenu">("leftMenu")

  const leftAsideCollapsed = ref(true)
  const rightAsideCollapsed = ref(false)

  const leftAsideWidth = computed(() => {
    return leftAsideCollapsed.value ? 66 : 220
  })

  const rightAsideWidth = computed(() => {
    return rightAsideCollapsed.value ? 66 : 220
  })

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
    leftAsideWidth,
    rightAsideWidth,
    leftAsidePinned,
    onUpdateLayout,
    onUpdateLeftAsideCollapsed,
    onUpdateRightAsideCollapsed,
    onUpdateLeftAsidePinned,
    onUpdateRightAsidePinned,
  }
})
