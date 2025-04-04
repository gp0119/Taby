<template>
  <div class="group/item w-full border-b border-border-color">
    <div
      class="group/collection-title flex w-full items-center justify-between bg-body-color px-6 py-3"
    >
      <div class="flex-center select-none">
        <div class="flex-center relative">
          <n-checkbox
            class="absolute -left-5 mr-2 hidden w-[20px] group-hover/collection-title:block"
            :class="{
              '!block': batchCollectionStore.selectedCollectionIds.includes(
                collection.id,
              ),
            }"
            size="large"
            :checked="
              batchCollectionStore.selectedCollectionIds.includes(collection.id)
            "
            @update:checked="onHandleCheckbox($event, collection.id)"
          />
          <div
            class="flex-center cursor-pointer text-text-primary"
            @click="isOpen = !isOpen"
            :class="{
              '!text-primary':
                batchCollectionStore.selectedCollectionIds.includes(
                  collection.id,
                ),
            }"
          >
            <n-icon
              size="20"
              class="w-[20px] transition-transform duration-300"
              :class="{ 'rotate-90': isOpen }"
            >
              <ChevronForward />
            </n-icon>
            <span class="ml-2 text-lg font-medium">
              {{ collection.title }}
            </span>
          </div>
        </div>
        <Tags :labels="collection.labels" :collection-id="collection.id" />
      </div>
      <CollectionAction :item="collection" />
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <div class="bg-body-color px-5 pb-4">
          <slot name="cards" :collection="collection"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronForward } from "@vicons/ionicons5"
import { CollectionWithCards } from "@/type"
import CollectionAction from "./collection-action.vue"
import Tags from "./tags.vue"
import { useExpandStore } from "@/store/expand"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchCardStore } from "@/store/batch-card"

const props = defineProps<{
  collection: CollectionWithCards
}>()

const expandStore = useExpandStore()
const batchCollectionStore = useBatchCollectionStore()
const isOpen = computed({
  get: () => expandStore.isCollectionExpanded(props.collection.id),
  set: (value) => {
    if (value) {
      expandStore.toggleCollection(props.collection.id)
    } else {
      expandStore.toggleCollection(props.collection.id)
    }
  },
})

const batchCardStore = useBatchCardStore()
const onHandleCheckbox = (checked: boolean, collectionId: number) => {
  if (checked) {
    batchCardStore.clearSelectedCardIds()
    batchCollectionStore.addSelectedCollectionId(collectionId)
  } else {
    batchCollectionStore.removeSelectedCollectionId(collectionId)
  }
}
</script>
