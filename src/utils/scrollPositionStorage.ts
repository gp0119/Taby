import { ref } from "vue"

export const MAIN_SCROLL_ANCHORS_KEY = "mainScrollAnchors"
export const MAIN_SCROLL_SIZE_CACHES_KEY = "mainScrollSizeCaches"

export const mainScrollPositionResetVersion = ref(0)

export function resetMainScrollPosition() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(MAIN_SCROLL_ANCHORS_KEY)
    localStorage.removeItem(MAIN_SCROLL_SIZE_CACHES_KEY)
  }
  mainScrollPositionResetVersion.value += 1
}
