<template>
  <div
    class="h-[calc(100vh-100px)] overflow-y-auto"
    style="scrollbar-width: thin; scrollbar-color: #d1d5db transparent"
  >
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
            <n-checkbox
              class="mr-2"
              size="large"
              :checked="
                batchCollectionStore.selectedCollectionIds.includes(
                  collection.id,
                )
              "
              @update:checked="onHandleCheckbox($event, collection.id)"
            />
            <span class="text-lg font-medium text-text-primary">{{
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
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { CollectionWithCards } from "@/type"
import Tags from "./tags.vue"
import { VueDraggable } from "vue-draggable-plus"
import { useBatchCollectionStore } from "@/store/batch-collection"

const batchCollectionStore = useBatchCollectionStore()
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

const onHandleCheckbox = (checked: boolean, collectionId: number) => {
  if (checked) {
    batchCollectionStore.addSelectedCollectionId(collectionId)
  } else {
    batchCollectionStore.removeSelectedCollectionId(collectionId)
  }
}
</script>

<style lang="less" scoped></style>
