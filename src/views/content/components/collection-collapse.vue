<template>
  <div class="group/item w-full border-b border-border-color">
    <div
      class="flex w-full items-center justify-between bg-body-color px-4 py-3"
    >
      <div class="flex-center select-none">
        <div class="flex-center" @click="isOpen = !isOpen">
          <n-icon
            size="20"
            class="mr-2 cursor-pointer transition-transform duration-300"
            :class="{ 'rotate-90': isOpen }"
          >
            <ChevronForward />
          </n-icon>
          <span class="cursor-pointer text-lg font-medium text-gray-900">{{
            collection.title
          }}</span>
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
        <div class="bg-body-color px-4 pb-4">
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
import { useLocalStorage } from "@vueuse/core"

const props = defineProps<{
  collection: CollectionWithCards
}>()

const isOpen = useLocalStorage(`collection-${props.collection.id}-open`, true)
</script>
