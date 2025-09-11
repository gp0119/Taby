<template>
  <div
    v-if="labels.length"
    class="scrollbar-none flex items-center gap-x-3 overflow-auto py-3"
  >
    <Tag
      v-for="tag in labels"
      :key="tag.id"
      class="group/tag"
      :tag="tag"
      closeable
      @delete="onDeleteTagFromCollection(tag.id)"
    />
  </div>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { Label } from "@/type.ts"
import Tag from "@/components/tag.vue"
const props = defineProps<{
  labels: Label[]
  collectionId: number
}>()

const { refreshCollections } = useRefresh()
const onDeleteTagFromCollection = async (tagId: number) => {
  await dataManager.removeTagforCollection(props.collectionId, tagId)
  await refreshCollections()
}
</script>
