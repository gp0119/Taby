<template>
  <template v-if="!draggableStore.draggable">
    <SkeletonContent v-if="loading" />
    <DynamicScroller
      v-else-if="collections?.length"
      :items="collections"
      :min-item-size="160"
      class="dynamic-scroller-optimize h-[calc(100vh-100px)] overflow-y-auto"
      style="scrollbar-width: thin; scrollbar-color: #d1d5db transparent"
      :prerender="5"
      :buffer="500"
      key-field="id"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :index="index"
          :active="active"
          :data-index="index"
          :data-active="active"
          :size-dependencies="[item.cards]"
        >
          <div v-memo="[item, item.cards.length]">
            <CollectionCollapse :collection="item">
              <template #cards="{ collection }">
                <CardsWrapper
                  :cards="collection.cards"
                  :collection-id="collection.id"
                />
              </template>
            </CollectionCollapse>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    <div
      v-else
      class="bg-body-color py-16 text-center text-2xl text-gray-400"
      v-memo="['no-collections']"
    >
      {{ ft("no-collections") }}
    </div>
    <BatchCardAction />
  </template>
  <template v-else>
    <title-dragable :collections="collections" />
    <BatchCollectionAction />
  </template>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useDraggableStore } from "@/store/draggable.ts"
import { useSortStore } from "@/store/sort.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { useTagsStore } from "@/store/tags.ts"
import CardsWrapper from "@/views/content/components/cards-wrapper.vue"
import TitleDragable from "@/views/content/components/title-draggable.vue"
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller"
import "vue-virtual-scroller/dist/vue-virtual-scroller.css"
import BatchCardAction from "./components/batch-card-action.vue"
import CollectionCollapse from "./components/collection-collapse.vue"
import BatchCollectionAction from "./components/batch-collection-action.vue"
import SkeletonContent from "@/components/skeleton-content.vue"
import { Collection } from "@/type"
const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const draggableStore = useDraggableStore()
const { ft } = useHelpi18n()

const { loading } = inject("loading", {
  loading: false,
})

const zhCollator = new Intl.Collator("zh")

const filteredCollections = computed(() => {
  let baseCollections = spacesStore.collections
  if (tagsStore.selectedTag?.id) {
    return baseCollections.filter((item) =>
      item.labelIds.includes(tagsStore.selectedTag!.id),
    )
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
</script>

<style scoped>
.dynamic-scroller-optimize :deep(.vue-recycle-scroller__item-view) {
  overflow: visible !important;
  transform: translateZ(0);
  will-change: transform;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
