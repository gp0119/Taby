import { useLocalStorage } from "@vueuse/core"
import { onBeforeUnmount, onMounted, unref, watch, type Ref } from "vue"
import type { ComponentPublicInstance, ShallowUnwrapRef } from "vue"
import type {
  CacheSnapshot,
  DynamicScrollerExposed,
} from "vue-virtual-scroller"
import type { Collection } from "@/type"

export type MainScrollerRef = ShallowUnwrapRef<
  DynamicScrollerExposed<Collection>
> &
  Pick<ComponentPublicInstance, "$el">

// 持久化的快照额外带上测量时的容器宽度，用于跨宽度失效。
export interface ScrollerSizeSnapshot extends CacheSnapshot {
  width: number
}

interface SizeCaches {
  [spaceId: number]: ScrollerSizeSnapshot
}

export function useScrollerSizeCache(
  scrollerRef: Ref<MainScrollerRef | null>,
  getActiveSpaceId: () => number,
) {
  const sizeCaches = useLocalStorage<SizeCaches>("mainScrollSizeCaches", {})

  function capture(spaceId: number) {
    const scroller = scrollerRef.value
    const snapshot = unref(scroller?.cacheSnapshot)
    const width = scroller?.$el?.clientWidth
    if (snapshot?.keys?.length && width) {
      // console.log("capture size", width)
      sizeCaches.value[spaceId] = {
        width,
        keys: [...snapshot.keys],
        sizes: [...snapshot.sizes],
      }
    }
  }

  function restore() {
    const scroller = scrollerRef.value
    const cache = sizeCaches.value[getActiveSpaceId()]
    if (!cache || !scroller) return
    // 高度随容器宽度变化：宽度不一致时缓存失效，放弃回填、让 scroller 重新测量。
    if (cache.width !== scroller.$el?.clientWidth) return
    // console.log("restore size")
    scroller.restoreCache({ keys: cache.keys, sizes: cache.sizes })
  }

  // scroller 重建后（ref 从 null 变为新实例）回填当前 space 的高度缓存。
  watch(
    () => scrollerRef.value,
    (scroller) => {
      if (scroller) restore()
    },
  )

  // 切换 space 时此刻 scrollerRef 仍指向上一个 space 的实例（:key 尚未触发重建），抓其快照。
  watch(getActiveSpaceId, (_newId, oldId) => {
    if (typeof oldId === "number") capture(oldId)
  })

  // 刷新/关闭页面前抓当前 space，保证刷新后仍是热缓存。
  const captureActive = () => capture(getActiveSpaceId())
  onMounted(() => window.addEventListener("pagehide", captureActive))
  onBeforeUnmount(() => window.removeEventListener("pagehide", captureActive))
}
