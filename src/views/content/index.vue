<template>
  <template v-if="!draggableStore.draggable">
    <DynamicScroller
      v-if="collections?.length"
      :items="collections"
      :min-item-size="100"
      style="height: calc(100vh - 100px); overflow-y: scroll"
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
      No collections shared with this space yet.
    </div>
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
import TitleDragable from "@/views/content/components/title-draggable.vue"
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller"
import "vue-virtual-scroller/dist/vue-virtual-scroller.css"
import CollectionCollapse from "./components/collection-collapse.vue"
import CardsWrapper from "@/views/content/components/cards-wrapper.vue"

const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const draggableStore = useDraggableStore()

const collections = computed(() => {
  let sortedCollections = [...spacesStore.collections]
  if (tagsStore.selectedTag) {
    sortedCollections = [...spacesStore.collections].filter((item) =>
      item.labelIds.includes(tagsStore.selectedTag.id),
    )
  }
  if (sortStore.order) {
    return [...sortedCollections].sort((a, b) => {
      if (sortStore.sort === "Title") {
        const collator = new Intl.Collator("zh")
        const compareResult = collator.compare(a.title, b.title)
        return sortStore.order === "asc" ? compareResult : -compareResult
      } else if (sortStore.sort === "CreatedAt") {
        return sortStore.order === "asc"
          ? a.createdAt - b.createdAt
          : b.createdAt - a.createdAt
      } else if (sortStore.sort === "Draggable") {
        return a.order - b.order
      }
      return sortStore.order === "asc"
        ? a[sortStore.sort] > b[sortStore.sort]
          ? 1
          : -1
        : a[sortStore.sort] < b[sortStore.sort]
          ? 1
          : -1
    })
  }
  return sortedCollections
})
</script>
<style scoped>
.n-collapse :deep(.n-collapse-item) {
  border: none;
}
</style>
