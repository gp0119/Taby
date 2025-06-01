<template>
  <div
    class="scrollbar-thin scrollbar-gutter-stable h-[calc(100vh-60px)] overflow-y-auto"
  >
    <VueDraggable
      :model-value="collections"
      item-key="id"
      ghost-class="sortable-ghost-dashed-border"
      class="flex flex-col pb-2 pl-4 pr-2"
      @end="onDragEnd"
    >
      <div
        v-for="collection in collections"
        :key="collection.id"
        :data-id="collection.id"
        class="my-2 flex w-full cursor-move items-center justify-between rounded-lg border-2 border-transparent bg-white px-6 py-3"
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
          <div
            class="ml-2 flex cursor-pointer items-center rounded bg-body-color py-0.5 pl-1.5 pr-0.5 text-xs text-text-secondary"
          >
            {{ collection.cards.length }} cards
            <n-icon size="12" :component="ArrowUpRight" />
          </div>
          <span
            v-if="collection.labels.length > 0"
            class="mx-4 h-[16px] w-[0.5px] bg-text-secondary"
          />
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
import { ArrowUpRight } from "@vicons/carbon"

defineProps<{
  collections: CollectionWithCards[]
}>()

const { refreshCollections, updateContextMenus } = useRefresh()

const onDragEnd = async (event: any) => {
  const { newIndex, oldIndex, item } = event
  if (newIndex === oldIndex) return
  const collectionId = item.getAttribute("data-id")
  await dataManager.moveCollection(Number(collectionId), oldIndex, newIndex)
  await refreshCollections()
  await updateContextMenus()
}
</script>

<style lang="less" scoped></style>
