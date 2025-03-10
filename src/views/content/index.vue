<template>
  <template v-if="!draggableStore.draggable">
    <div
      v-if="!collections?.length"
      class="h-[calc(100vh-100px)] overflow-y-auto"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="w-full animate-pulse border-b border-border-color p-4"
      >
        <div class="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
        <div class="h-20 w-full rounded bg-gray-100"></div>
      </div>
    </div>
    <DynamicScroller
      v-else-if="collections?.length"
      :items="collections"
      :min-item-size="100"
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

const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const draggableStore = useDraggableStore()
const { ft } = useHelpi18n()

const zhCollator = new Intl.Collator("zh")

const collections = computed(() => {
  let baseCollections = spacesStore.collections

  if (tagsStore.selectedTag?.id) {
    baseCollections = baseCollections.filter((item) =>
      item.labelIds.includes(tagsStore.selectedTag!.id),
    )
  }

  if (!sortStore.sortOrder) {
    return baseCollections
  }

  return [...baseCollections].sort((a, b) => {
    switch (sortStore.sortOrder) {
      case "title-asc":
      case "title-desc":
        return sortStore.sortOrder === "title-asc"
          ? zhCollator.compare(a.title, b.title)
          : -zhCollator.compare(a.title, b.title)
      case "created-at-asc":
        return (a.createdAt ?? 0) - (b.createdAt ?? 0)
      case "created-at-desc":
        return (b.createdAt ?? 0) - (a.createdAt ?? 0)
      case "draggable":
        return a.order - b.order
      default:
        return 0
    }
  })
})
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
