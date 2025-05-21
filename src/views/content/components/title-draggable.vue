<template>
  <div class="scrollbar-thin h-[calc(100vh-60px)] overflow-y-auto">
    <VueDraggable
      :model-value="collections"
      item-key="id"
      ghost-class="sortable-ghost-dashed-border"
      @end="onDragEnd"
    >
      <div
        v-for="collection in collections"
        :key="collection.id"
        :data-id="collection.id"
        class="flex w-full cursor-move items-center justify-between border-b border-border-color bg-body-color px-6 py-3"
      >
        <div class="flex-center select-none">
          <div class="flex-center">
            <n-icon
              size="18"
              class="w-[20px] text-text-secondary"
              :component="Move"
            />
            <span class="ml-2 text-lg font-medium text-text-primary">
              {{ collection.title }}
            </span>
          </div>
          <Tags
            class="pointer-events-none"
            :labels="collection.labels"
            :collection-id="collection.id"
          />
        </div>
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { CollectionWithCards } from "@/type"
import Tags from "./tags.vue"
import { VueDraggable } from "vue-draggable-plus"
import { Move } from "@vicons/ionicons5"

defineProps<{
  collections: CollectionWithCards[]
}>()

const { refreshCollections } = useRefresh()

const onDragEnd = async (event: any) => {
  const { newIndex, oldIndex, item } = event
  if (newIndex === oldIndex) return
  const collectionId = item.getAttribute("data-id")
  await dataManager.moveCollection(Number(collectionId), oldIndex, newIndex)
  await refreshCollections()
}
</script>

<style lang="less" scoped></style>
