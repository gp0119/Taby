<template>
  <template v-if="!draggableStore.draggable">
    <SkeletonContent v-if="loading" />
    <DynamicScroller
      v-else-if="collections?.length"
      :items="collections"
      :min-item-size="160"
      class="dynamic-scroller-optimize scrollbar-thin scrollbar-gutter-stable h-[calc(100vh-60px)] overflow-y-auto"
      key-field="id"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :index="index"
          :active="active"
          :data-index="index"
          :data-active="active"
          :size-dependencies="[item.cards.length]"
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
</style>
