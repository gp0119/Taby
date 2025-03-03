<template>
  <template v-if="!draggableStore.draggable">
    <DynamicScroller
      v-if="collections?.length"
      :items="collections"
      :min-item-size="100"
      style="height: calc(100vh - 50px); overflow-y: scroll"
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
import { useSpacesStore } from "@/store/spaces.ts"
import { useTagsStore } from "@/store/tags.ts"
import TitleDragable from "@/views/content/components/title-draggable.vue"
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller"
import "vue-virtual-scroller/dist/vue-virtual-scroller.css"
import CollectionCollapse from "./components/collection-collapse.vue"
import CardsWrapper from "@/views/content/components/cards-wrapper.vue"

const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const draggableStore = useDraggableStore()

watch(
  () => draggableStore.draggable,
  (newVal) => {
    console.log("newVal: ", newVal)
  },
)

const collections = computed(() => {
  if (!tagsStore.selectedTagId) return spacesStore.collections
  return spacesStore.collections.filter((item) =>
    item.labelIds.includes(tagsStore.selectedTagId!),
  )
})
</script>
<style scoped>
.n-collapse :deep(.n-collapse-item) {
  border: none;
}
</style>
