<template>
  <div class="h-[calc(100vh-50px)] overflow-y-auto">
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
        class="flex w-full cursor-move items-center justify-between border-b border-border-color bg-body-color px-4 py-3"
      >
        <div class="flex-center select-none">
          <div class="flex-center">
            <n-icon size="20" class="mr-2">
              <ChevronForward />
            </n-icon>
            <span class="text-lg font-medium text-gray-900">{{
              collection.title
            }}</span>
          </div>
          <Tags :labels="collection.labels" :collection-id="collection.id" />
        </div>
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import DataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { ChevronForward } from "@vicons/ionicons5"
import { CollectionWithCards } from "@/type"
import Tags from "./tags.vue"
import { VueDraggable } from "vue-draggable-plus"

defineProps<{
  collections: CollectionWithCards[]
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()

const onDragEnd = async (event: any) => {
  const { newIndex, oldIndex, item } = event
  const collectionId = item.getAttribute("data-id")
  console.log("newIndex: ", newIndex)
  console.log("oldIndex: ", oldIndex)
  await dataManager.moveCollection(Number(collectionId), oldIndex, newIndex)
  await refreshCollections()
}
</script>

<style lang="less" scoped></style>
