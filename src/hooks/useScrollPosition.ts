import { useSettingStore } from "@/store/setting"
import { useSpacesStore } from "@/store/spaces"
import { useLocalStorage } from "@vueuse/core"
import { debounce } from "lodash-es"
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  unref,
  watch,
  type Ref,
} from "vue"
import type { ComponentPublicInstance, ShallowUnwrapRef } from "vue"
import type {
  CacheSnapshot,
  DynamicScrollerExposed,
} from "vue-virtual-scroller"
import type { Collection } from "@/type"
import {
  MAIN_SCROLL_ANCHORS_KEY,
  MAIN_SCROLL_SIZE_CACHES_KEY,
  mainScrollPositionResetVersion,
} from "@/utils/scrollPositionStorage"

export type MainScrollerRef = ShallowUnwrapRef<
  DynamicScrollerExposed<Collection>
> &
  Pick<ComponentPublicInstance, "$el">

interface ScrollAnchor {
  key: number
  offset: number
}

interface ScrollAnchors {
  [spaceId: number]: ScrollAnchor
}

interface ScrollerSizeSnapshot extends CacheSnapshot {
  width: number
}

interface SizeCaches {
  [spaceId: number]: ScrollerSizeSnapshot
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve())
      return
    }
    setTimeout(resolve)
  })
}

export function useScrollPosition(
  scrollerRef: Ref<MainScrollerRef | null>,
  getItems: () => Collection[],
) {
  const spacesStore = useSpacesStore()
  const settingStore = useSettingStore()
  const anchors = useLocalStorage<ScrollAnchors>(MAIN_SCROLL_ANCHORS_KEY, {})
  const sizeCaches = useLocalStorage<SizeCaches>(
    MAIN_SCROLL_SIZE_CACHES_KEY,
    {},
  )
  let resizeObserver: ResizeObserver | null = null
  let observedScrollerWidth = 0

  const enabled = () => settingStore.getSetting("rememberScrollPosition")

  const save = debounce((spaceId: number, anchor: ScrollAnchor) => {
    anchors.value[spaceId] = anchor
  }, 200)

  function resetStoredPosition() {
    save.cancel()
    anchors.value = {}
    sizeCaches.value = {}
  }

  function removeSizeCache(spaceId: number) {
    if (!(spaceId in sizeCaches.value)) return
    const nextCaches = { ...sizeCaches.value }
    delete nextCaches[spaceId]
    sizeCaches.value = nextCaches
  }

  function resetCurrentScroller() {
    const scroller = scrollerRef.value
    if (!scroller) return
    scroller.forceUpdate(true)
    scroller.scrollToPosition(0)
    const el = scroller.$el as HTMLElement | undefined
    if (el) el.scrollTop = 0
  }

  function resetAfterDataReplace() {
    resetStoredPosition()
    resetCurrentScroller()
    void nextTick(async () => {
      resetCurrentScroller()
      await nextFrame()
      resetCurrentScroller()
    })
  }

  function captureCurrentAnchor(): ScrollAnchor | null {
    const scroller = scrollerRef.value
    const el = scroller?.$el as HTMLElement | undefined
    if (!scroller || !el) return null

    const scrollerRect = el.getBoundingClientRect()
    const itemEls = Array.from(el.querySelectorAll<HTMLElement>("[data-index]"))
    let best: { index: number; offset: number; score: number } | null = null

    for (const itemEl of itemEls) {
      const index = Number(itemEl.dataset.index)
      if (!Number.isInteger(index)) continue

      const rect = itemEl.getBoundingClientRect()
      if (rect.bottom <= scrollerRect.top || rect.top >= scrollerRect.bottom) {
        continue
      }

      const score = Math.max(rect.top, scrollerRect.top) - scrollerRect.top
      if (!best || score < best.score) {
        best = {
          index,
          offset: Math.max(0, scrollerRect.top - rect.top),
          score,
        }
      }
    }

    if (best) {
      const item = getItems()[best.index]
      if (item) return { key: item.id, offset: best.offset }
    }

    const scrollTop = el.scrollTop
    const index = scroller.findItemIndex(scrollTop)
    const item = getItems()[index]
    if (!item) return null
    return {
      key: item.id,
      offset: scrollTop - scroller.getItemOffset(index),
    }
  }

  function handleScroll(event: Event) {
    if (!enabled()) return
    if (document.visibilityState !== "visible") return
    const target = event.target as HTMLElement
    if (Number(target.dataset.spaceId) !== spacesStore.activeId) return
    const scroller = scrollerRef.value
    if (!scroller) return
    const scrollTop = target.scrollTop
    const index = scroller.findItemIndex(scrollTop)
    const item = getItems()[index]
    if (!item) return
    save(spacesStore.activeId, {
      key: item.id,
      offset: scrollTop - scroller.getItemOffset(index),
    })
  }

  // 切换 space / 刷新页面前，抓当前 scroller 的 item 高度快照，连同容器宽度落盘。
  function captureSize(spaceId: number) {
    if (!enabled()) return
    const scroller = scrollerRef.value
    const snapshot = unref(scroller?.cacheSnapshot)
    const width = scroller?.$el?.clientWidth
    if (
      width &&
      observedScrollerWidth &&
      Math.abs(width - observedScrollerWidth) >= 1
    ) {
      observedScrollerWidth = width
      removeSizeCache(spaceId)
      scroller?.forceUpdate(true)
      return
    }
    if (snapshot?.keys?.length && width) {
      sizeCaches.value[spaceId] = {
        width,
        keys: [...snapshot.keys],
        sizes: [...snapshot.sizes],
      }
    }
  }

  // scroller 重建后回填高度缓存，让总高度一开始就准确、滚动不跳动。
  function restoreSize() {
    const scroller = scrollerRef.value
    const cache = sizeCaches.value[spacesStore.activeId]
    if (!cache || !scroller) return
    // 高度随容器宽度变化：宽度不一致时缓存失效，放弃回填、让 scroller 重新测量。
    if (cache.width !== scroller.$el?.clientWidth) return
    scroller.restoreCache({ keys: cache.keys, sizes: cache.sizes })
  }

  // 按锚点把滚动定位回顶部那一项。
  async function restoreScroll(spaceId = spacesStore.activeId) {
    const scroller = scrollerRef.value
    if (!scroller) return
    const anchor = anchors.value[spaceId]
    if (!anchor) return
    const index = getItems().findIndex((item) => item.id === anchor.key)
    if (index === -1) return
    // scroller 重建后高度回填需若干帧才稳定，逐帧重对齐直到落点到位，
    // 避免首帧 scrollHeight 偏小把目标位置裁剪掉。
    await nextTick()
    const el = scroller.$el as HTMLElement
    let stableFrames = 0
    for (let i = 0; i < 8; i++) {
      if (spacesStore.activeId !== spaceId || scrollerRef.value !== scroller) {
        return
      }
      scroller.scrollToItem(index, { offset: anchor.offset })
      await nextFrame()
      const target = scroller.getItemOffset(index) + anchor.offset
      if (Math.abs(el.scrollTop - target) < 1) {
        stableFrames += 1
        if (stableFrames >= 2) break
      } else {
        stableFrames = 0
      }
    }
  }

  function handleScrollerWidthChange() {
    if (!enabled()) return
    const scroller = scrollerRef.value
    if (!scroller) return

    const spaceId = spacesStore.activeId
    save.flush()
    const anchor = captureCurrentAnchor()
    if (anchor) anchors.value[spaceId] = anchor
    removeSizeCache(spaceId)
    scroller.forceUpdate(true)
    void restoreScroll(spaceId)
  }

  function observeScrollerWidth(scroller: MainScrollerRef | null) {
    resizeObserver?.disconnect()
    resizeObserver = null
    observedScrollerWidth = 0

    const el = scroller?.$el as HTMLElement | undefined
    if (!el || typeof ResizeObserver === "undefined") return

    observedScrollerWidth = el.clientWidth
    resizeObserver = new ResizeObserver(() => {
      const width = el.clientWidth
      if (!width || Math.abs(width - observedScrollerWidth) < 1) return
      observedScrollerWidth = width
      handleScrollerWidthChange()
    })
    resizeObserver.observe(el)
  }

  // scroller 重建后（ref 从 null 变为新实例）先回填高度缓存、再按锚点定位，
  // 顺序保证 scrollToItem 时高度已就位，落点才准确。仅在开启记忆时恢复。
  watch(
    () => scrollerRef.value,
    (scroller) => {
      observeScrollerWidth(scroller)
      if (!scroller || !enabled()) return
      restoreSize()
      restoreScroll()
    },
  )

  // tab 从后台切回前台时，其它 tab 可能已更新了锚点，重新对齐一次。
  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") return
    if (!enabled()) return
    restoreScroll()
  }
  document.addEventListener("visibilitychange", handleVisibilityChange)

  // 切换 space 前：落盘待写入的锚点，并抓上一个 space 的高度快照
  //（此刻 scrollerRef 仍指向旧实例，:key 尚未触发重建）。
  watch(
    () => spacesStore.activeId,
    (_newId, oldId) => {
      save.flush()
      if (typeof oldId === "number") captureSize(oldId)
    },
  )

  // 刷新/关闭页面前抓当前 space 的高度快照，保证刷新后仍是热缓存。
  const captureActive = () => captureSize(spacesStore.activeId)
  onMounted(() => window.addEventListener("pagehide", captureActive))

  // 关闭「记忆滚动位置」时清空已存锚点与高度缓存。
  watch(enabled, (on) => {
    if (!on) {
      resetStoredPosition()
    }
  })

  watch(mainScrollPositionResetVersion, resetAfterDataReplace, {
    flush: "sync",
  })

  onBeforeUnmount(() => {
    save.flush()
    save.cancel()
    resizeObserver?.disconnect()
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("pagehide", captureActive)
  })

  return { handleScroll }
}
