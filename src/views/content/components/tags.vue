<template>
  <n-space v-if="labels.length" class="ml-3">
    <Tag
      class="group/tag"
      :tag="tag"
      v-for="tag in labels"
      :key="tag.id"
      closeable
      @delete="onDeleteTagFromCollection(tag.id)"
    />
  </n-space>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { Label } from "@/type.ts"
import Tag from "@/components/tag.vue"
const props = defineProps<{
  labels: Label[]
  collectionId: string
}>()

const { refreshCollections } = useRefresh()
const onDeleteTagFromCollection = async (tagId: string) => {
  await dataManager.removeTagforCollection(props.collectionId, tagId)
  await refreshCollections()
}
</script>
