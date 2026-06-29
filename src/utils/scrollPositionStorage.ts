import { ref } from "vue"

export const MAIN_SCROLL_POSITION_CACHE_KEY = "mainScrollPositionCache"

export const mainScrollPositionResetVersion = ref(0)

export function resetMainScrollPosition() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(MAIN_SCROLL_POSITION_CACHE_KEY)
  }
  mainScrollPositionResetVersion.value += 1
}
