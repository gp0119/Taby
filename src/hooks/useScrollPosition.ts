import { useSettingStore } from "@/store/setting"
import { useSpacesStore } from "@/store/spaces"
import { useLocalStorage } from "@vueuse/core"
import { debounce } from "lodash-es"
import { onBeforeUnmount, watch, type Ref } from "vue"

export interface ScrollPositionScroller {
  scrollToPosition: (position: number) => void
}

interface ScrollOffsets {
  [spaceId: number]: number
}

export function useScrollPosition(
  scrollerRef: Ref<ScrollPositionScroller | null>,
) {
  const spacesStore = useSpacesStore()
  const settingStore = useSettingStore()
  const offsets = useLocalStorage<ScrollOffsets>("mainScrollPositions", {})

  const save = debounce((spaceId: number, scrollTop: number) => {
    if (spaceId !== spacesStore.activeId) return
    // console.log("save scrollTop", scrollTop)
    offsets.value[spaceId] = scrollTop
  }, 200)

  function handleScroll(event: Event) {
    if (!settingStore.getSetting("rememberScrollPosition")) return
    const target = event.target as HTMLElement
    if (Number(target.dataset.spaceId) !== spacesStore.activeId) return
    save(spacesStore.activeId, target.scrollTop)
  }

  // scroller 重建后（ref 从 null 变为新实例）回填当前 space 的滚动偏移。
  watch(
    () => scrollerRef.value,
    async (scroller) => {
      if (!scroller) return
      if (!settingStore.getSetting("rememberScrollPosition")) return
      const saved = offsets.value[spacesStore.activeId]
      await nextTick()
      // console.log("scrollToPosition", saved)
      scroller.scrollToPosition(saved)
    },
  )

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
  })

  return { handleScroll }
}
