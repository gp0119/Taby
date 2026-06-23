import { useSettingStore } from "@/store/setting"
import { useSpacesStore } from "@/store/spaces"
import { Collection } from "@/type"
import { useLocalStorage } from "@vueuse/core"
import { debounce } from "lodash-es"
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  unref,
  watch,
  type ComputedRef,
  type MaybeRef,
  type Ref,
} from "vue"

export interface DynamicScrollerInstance {
  $el: HTMLElement
  scrollToItem: (index: number) => void
  scrollToPosition: (position: number) => void
}

interface ScrollPosition {
  collectionId: number
  offset: number
  scrollTop: number
}

type StoredScrollPosition = number | ScrollPosition

interface ScrollPositions {
  [spaceId: number]: StoredScrollPosition
}

interface UseMainScrollerOptions {
  collections: ComputedRef<Collection[]>
  draggable: ComputedRef<boolean>
  loading: MaybeRef<boolean>
  scrollerRef: Ref<DynamicScrollerInstance | null>
}

export function useMainScroller(options: UseMainScrollerOptions) {
  const spacesStore = useSpacesStore()
  const settingStore = useSettingStore()
  let isActivePage = document.visibilityState === "visible"
  const scrollPositions = useLocalStorage<ScrollPositions>(
    "mainScrollPositions",
    {},
  )
  let restoredSpaceId: number | null = null

  async function refreshActivePageState() {
    const currentTab = await chrome.tabs.getCurrent()
    if (!currentTab) {
      isActivePage = false
      return
    }
    const currentWindow = currentTab.windowId
      ? await chrome.windows.get(currentTab.windowId)
      : null
    isActivePage =
      document.visibilityState === "visible" &&
      document.hasFocus() &&
      currentTab.active === true &&
      currentWindow?.focused === true
  }

  const saveScrollPosition = debounce(
    (spaceId: number, position: StoredScrollPosition) => {
      if (!isActivePage) return
      scrollPositions.value[spaceId] = position
    },
    200,
  )

  function getScrollPosition(scroller: HTMLElement): StoredScrollPosition {
    const scrollerTop = scroller.getBoundingClientRect().top
    const visibleItems = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-index]"),
    )
      .map((element) => ({ element, rect: element.getBoundingClientRect() }))
      .filter(({ rect }) => rect.bottom > scrollerTop)
      .sort((a, b) => a.rect.top - b.rect.top)

    const firstVisible = visibleItems[0]
    if (!firstVisible) return scroller.scrollTop

    const index = Number(firstVisible.element.dataset.index)
    const collection = options.collections.value[index]
    if (!collection) return scroller.scrollTop

    return {
      collectionId: collection.id,
      offset: firstVisible.rect.top - scrollerTop,
      scrollTop: scroller.scrollTop,
    }
  }

  function handleScroll(event: Event) {
    if (!settingStore.getSetting("rememberScrollPosition")) return
    if (!isActivePage) return
    const target = event.target as HTMLElement
    saveScrollPosition(spacesStore.activeId, getScrollPosition(target))
  }

  function nextAnimationFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()))
  }

  watch(
    [
      () => unref(options.loading),
      () => spacesStore.activeId,
      () => options.collections.value.length,
      () => options.draggable.value,
      () => settingStore.getSetting("rememberScrollPosition"),
    ],
    async ([
      isLoading,
      spaceId,
      collectionCount,
      isDraggable,
      rememberScrollPosition,
    ]) => {
      if (isLoading || isDraggable || !collectionCount) return
      if (!rememberScrollPosition) {
        restoredSpaceId = null
        return
      }
      if (restoredSpaceId === spaceId) return

      await nextTick()
      if (spacesStore.activeId !== spaceId) return

      const scroller = options.scrollerRef.value
      const savedPosition = scrollPositions.value[spaceId]
      if (!scroller || savedPosition === undefined) {
        restoredSpaceId = spaceId
        return
      }

      if (typeof savedPosition === "number") {
        scroller.scrollToPosition(savedPosition)
      } else {
        const index = options.collections.value.findIndex(
          (collection) => collection.id === savedPosition.collectionId,
        )
        if (index === -1) {
          scroller.scrollToPosition(savedPosition.scrollTop)
        } else {
          scroller.scrollToItem(index)
          // DynamicScroller 会在渲染后重新测量集合高度，需要按锚点多次校准。
          for (let attempt = 0; attempt < 3; attempt++) {
            await nextAnimationFrame()
            if (spacesStore.activeId !== spaceId) return

            const anchor = scroller.$el.querySelector<HTMLElement>(
              `[data-index="${index}"]`,
            )
            if (!anchor) continue
            const actualOffset =
              anchor.getBoundingClientRect().top -
              scroller.$el.getBoundingClientRect().top
            const correction = actualOffset - savedPosition.offset
            if (Math.abs(correction) > 0.5) {
              scroller.scrollToPosition(scroller.$el.scrollTop + correction)
            }
          }
        }
      }
      restoredSpaceId = spaceId
    },
    { immediate: true },
  )

  watch(
    () => spacesStore.activeId,
    () => {
      if (isActivePage) {
        saveScrollPosition.flush()
      }
      restoredSpaceId = null
    },
  )

  watch(
    () => settingStore.getSetting("rememberScrollPosition"),
    (enabled) => {
      restoredSpaceId = null
      if (!enabled) {
        saveScrollPosition.cancel()
        scrollPositions.value = {}
      }
    },
  )

  onMounted(() => {
    refreshActivePageState()
    document.addEventListener("visibilitychange", refreshActivePageState)
    window.addEventListener("focus", refreshActivePageState)
    window.addEventListener("blur", refreshActivePageState)
    chrome.tabs.onActivated.addListener(refreshActivePageState)
    chrome.windows.onFocusChanged.addListener(refreshActivePageState)
  })

  onBeforeUnmount(() => {
    if (settingStore.getSetting("rememberScrollPosition") && isActivePage) {
      saveScrollPosition.flush()
    }
    saveScrollPosition.cancel()
    document.removeEventListener("visibilitychange", refreshActivePageState)
    window.removeEventListener("focus", refreshActivePageState)
    window.removeEventListener("blur", refreshActivePageState)
    chrome.tabs.onActivated.removeListener(refreshActivePageState)
    chrome.windows.onFocusChanged.removeListener(refreshActivePageState)
  })

  return {
    handleScroll,
  }
}
