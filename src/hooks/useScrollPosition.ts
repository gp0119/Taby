import { useSettingStore } from "@/store/setting"
import { useSpacesStore } from "@/store/spaces"
import { useLocalStorage } from "@vueuse/core"
import { debounce } from "lodash-es"
import { onBeforeUnmount, watch, type Ref } from "vue"
import type { MainScrollerRef } from "@/hooks/useScrollerSizeCache"

interface ScrollOffsets {
  [spaceId: number]: number
}

export function useScrollPosition(scrollerRef: Ref<MainScrollerRef | null>) {
  const spacesStore = useSpacesStore()
  const settingStore = useSettingStore()
  const offsets = useLocalStorage<ScrollOffsets>("mainScrollPositions", {})

  const save = debounce((spaceId: number, scrollTop: number) => {
    console.log("save scrollTop", scrollTop)
    offsets.value[spaceId] = scrollTop
  }, 200)

  function handleScroll(event: Event) {
    if (!settingStore.getSetting("rememberScrollPosition")) return
    if (document.visibilityState !== "visible") return
    const target = event.target as HTMLElement
    if (Number(target.dataset.spaceId) !== spacesStore.activeId) return
    save(spacesStore.activeId, target.scrollTop)
  }

  async function restore() {
    const scroller = scrollerRef.value
    if (!scroller) return
    if (!settingStore.getSetting("rememberScrollPosition")) return
    const saved = offsets.value[spacesStore.activeId]
    await nextTick()
    console.log("scrollToPosition", saved)
    scroller.scrollToPosition(saved)
  }

  // scroller 重建后（ref 从 null 变为新实例）回填当前 space 的滚动偏移。
  watch(() => scrollerRef.value, restore)

  // tab 从后台切回前台时，其它 tab 可能已更新了偏移，重新对齐一次。
  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return
    restore()
  }
  document.addEventListener("visibilitychange", handleVisibilityChange)

  // 切换 space 前把待写入的偏移落盘。
  watch(
    () => spacesStore.activeId,
    () => save.flush(),
  )

  // 关闭「记忆滚动位置」时清空已存偏移。
  watch(
    () => settingStore.getSetting("rememberScrollPosition"),
    (enabled) => {
      if (!enabled) {
        save.cancel()
        offsets.value = {}
      }
    },
  )

  onBeforeUnmount(() => {
    save.flush()
    save.cancel()
    document.removeEventListener("visibilitychange", handleVisibilityChange)
  })

  return { handleScroll }
}
