<template>
  <n-collapse-item
    :name="collection.id"
    class="!mt-0 bg-body-color p-5 [&_.n-collapse-item\_\_header]:!p-0"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <div class="select-none font-medium text-text-primary">
          {{ collection.title }}
        </div>
        <Tags :labels="collection.labels" :collection-id="collection.id" />
      </div>
    </template>
    <template #header-extra>
      <CollectionAction :item="collection" />
    </template>
    <template #default>
      <CardsWrapper :cards="collection.cards" />
    </template>
  </n-collapse-item>
</template>

<script setup lang="ts">
import { CollectionWithCards } from "@/type.ts"
import CardsWrapper from "@/views/content/components/cards-wrapper.vue"
import CollectionAction from "@/views/content/components/collection-action.vue"
import Tags from "@/views/content/components/tags.vue"

defineProps<{
  collection: CollectionWithCards
}>()
</script>
