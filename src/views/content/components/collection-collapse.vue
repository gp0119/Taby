<template>
  <div
    class="group/item w-full border-b border-border-color"
    :class="{
      'shadow-bottom': batchCollectionStore.selectedCollectionIds.includes(
        collection.id,
      ),
    }"
  >
    <div
      class="group/collection-title flex w-full items-center justify-between px-6 py-3"
    >
      <div class="flex-center select-none">
        <div class="flex-center relative">
          <n-checkbox
            class="absolute -left-5 mr-2 hidden w-[20px] group-hover/collection-title:block"
            :class="{
              '!block': batchCollectionStore.selectedCollectionIds.includes(
                collection.id,
              ),
              '!hidden':
                batchCardStore.selectedCardIds.length > 0 ||
                batchTabsStore.selectedTabIds.length > 0 ||
                duplicateCardStore.isFindDuplicate,
            }"
            size="large"
            :checked="
              batchCollectionStore.selectedCollectionIds.includes(collection.id)
            "
            @update:checked="onHandleCheckbox($event, collection.id)"
          />
          <div
            class="flex-center cursor-pointer text-text-primary"
            :class="{
              '!text-primary':
                batchCollectionStore.selectedCollectionIds.includes(
                  collection.id,
                ),
            }"
            @click="isOpen = !isOpen"
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
      <div class="-mt-1.5 overflow-hidden">
        <div class="px-5 pb-5">
          <slot name="cards" :collection="collection" />
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
import { useBatchTabsStore } from "@/store/batch-tabs"
import { useDuplicateCardStore } from "@/store/duplicate-card"

const duplicateCardStore = useDuplicateCardStore()
const props = defineProps<{
  collection: CollectionWithCards
}>()

const expandStore = useExpandStore()
const batchCollectionStore = useBatchCollectionStore()
const batchCardStore = useBatchCardStore()
const batchTabsStore = useBatchTabsStore()
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

const onHandleCheckbox = (checked: boolean, collectionId: number) => {
  if (checked) {
    batchCollectionStore.addSelectedCollectionId(collectionId)
  } else {
    batchCollectionStore.removeSelectedCollectionId(collectionId)
  }
}
</script>
