<template>
  <template v-if="!draggableStore.draggable">
    <DynamicScroller
      v-if="collections?.length"
      :items="collections"
      :min-item-size="100"
      class="h-[calc(100vh-100px)] overflow-y-auto"
      style="scrollbar-width: thin; scrollbar-color: #d1d5db transparent"
      :prerender="10"
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
    <div v-else class="bg-body-color py-16 text-center text-2xl text-gray-400">
      {{ ft("no-collections") }}
    </div>
    <BottomDrawer />
  </template>
  <template v-else>
    <title-dragable :collections="collections" />
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
import BottomDrawer from "./components/bottom-drawer.vue"
import CollectionCollapse from "./components/collection-collapse.vue"

const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const draggableStore = useDraggableStore()
const { ft } = useHelpi18n()

const collections = computed(() => {
  let sortedCollections = [...spacesStore.collections]
  if (tagsStore.selectedTag?.id) {
    sortedCollections = [...spacesStore.collections].filter((item) =>
      item.labelIds.includes(tagsStore.selectedTag!.id),
    )
  }
  if (sortStore.sortOrder) {
    return [...sortedCollections].sort((a, b) => {
      switch (sortStore.sortOrder) {
        case "title-asc":
        case "title-desc":
          const collator = new Intl.Collator("zh")
          return sortStore.sortOrder === "title-asc"
            ? collator.compare(a.title, b.title)
            : -collator.compare(a.title, b.title)
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
  }
  return sortedCollections
})
</script>
