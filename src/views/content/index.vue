<template>
  <template v-if="!draggableStore.draggable">
    <SkeletonContent v-if="loading" />
    <DynamicScroller
      v-else-if="collections?.length"
      ref="scrollerRef"
      :items="collections"
      :min-item-size="160"
      class="dynamic-scroller-optimize scrollbar-thin scrollbar-gutter-stable h-[calc(100vh-60px)] overflow-y-auto"
      key-field="id"
      @scroll.passive="handleScroll"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :index="index"
          :active="active"
          :data-index="index"
          :data-active="active"
          class="py-2 pl-4 pr-2"
        >
          <CollectionCollapse :collection="item">
            <template #cards="{ collection }">
              <CardsWrapper
                :cards="collection.cards"
                :collection-id="collection.id"
              />
            </template>
          </CollectionCollapse>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    <EmptySpace v-else />
    <BatchCardAction />
    <BatchCollectionAction />
  </template>
  <template v-else>
    <title-dragable :collections="collections" />
  </template>
</template>

<script setup lang="ts">
import { useDraggableStore } from "@/store/draggable.ts"
import { useSortStore } from "@/store/sort.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { useTagsStore } from "@/store/tags.ts"
import CardsWrapper from "@/views/content/components/cards-wrapper.vue"
import TitleDragable from "@/views/content/components/title-draggable.vue"
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller"
import "vue-virtual-scroller/dist/vue-virtual-scroller.css"
import { debounce } from "lodash-es"
import { useLocalStorage } from "@vueuse/core"
import BatchCardAction from "./components/batch-card-action.vue"
import CollectionCollapse from "./components/collection-collapse.vue"
import BatchCollectionAction from "./components/batch-collection-action.vue"
import SkeletonContent from "@/components/skeleton-content.vue"
import { Collection } from "@/type"
import EmptySpace from "@/components/empty-space.vue"

const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const draggableStore = useDraggableStore()

const { loading } = inject("loading", {
  loading: false,
})

const zhCollator = new Intl.Collator("zh")

const filteredCollections = computed(() => {
  let baseCollections = spacesStore.collections
  if (tagsStore.selectedTagIds.length) {
    return baseCollections.filter((item) => {
      if (tagsStore.tagFilterType === "AND") {
        return tagsStore.selectedTagIds.every((id) =>
          item.labelIds.includes(id),
        )
      }
      return tagsStore.selectedTagIds.some((id) => item.labelIds.includes(id))
    })
  }
  return baseCollections
})

const collections = computed(() => {
  if (sortStore.sortOrder === "draggable") {
    return filteredCollections.value
  }
  return [...filteredCollections.value].sort(sortCollections)
})

// 排序函数抽离
function sortCollections(a: Collection, b: Collection) {
  switch (sortStore.sortOrder) {
    case "title-asc":
      return zhCollator.compare(a.title, b.title)
    case "title-desc":
      return -zhCollator.compare(a.title, b.title)
    case "created-at-asc":
      return (a.createdAt ?? 0) - (b.createdAt ?? 0)
    case "created-at-desc":
      return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    default:
      return 0
  }
}

interface DynamicScrollerInstance {
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

const scrollerRef = ref<DynamicScrollerInstance | null>(null)
const scrollPositions = useLocalStorage<ScrollPositions>(
  "mainScrollPositions",
  {},
)
let restoredSpaceId: number | null = null

const saveScrollPosition = debounce(
  (spaceId: number, position: StoredScrollPosition) => {
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
  const collection = collections.value[index]
  if (!collection) return scroller.scrollTop

  return {
    collectionId: collection.id,
    offset: firstVisible.rect.top - scrollerTop,
    scrollTop: scroller.scrollTop,
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  saveScrollPosition(spacesStore.activeId, getScrollPosition(target))
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

watch(
  [
    () => unref(loading),
    () => spacesStore.activeId,
    () => collections.value.length,
    () => draggableStore.draggable,
  ],
  async ([isLoading, spaceId, collectionCount, isDraggable]) => {
    if (isLoading || isDraggable || !collectionCount) return
    if (restoredSpaceId === spaceId) return

    await nextTick()
    if (spacesStore.activeId !== spaceId) return

    const scroller = scrollerRef.value
    const savedPosition = scrollPositions.value[spaceId]
    if (!scroller || savedPosition === undefined) {
      restoredSpaceId = spaceId
      return
    }

    if (typeof savedPosition === "number") {
      scroller.scrollToPosition(savedPosition)
    } else {
      const index = collections.value.findIndex(
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
    saveScrollPosition.flush()
    restoredSpaceId = null
  },
)

onBeforeUnmount(() => {
  saveScrollPosition.flush()
  saveScrollPosition.cancel()
})
</script>

<style scoped>
.dynamic-scroller-optimize :deep(.vue-recycle-scroller__item-view) {
  overflow: visible !important;
  transform: translateZ(0);
  will-change: transform;
}
</style>
