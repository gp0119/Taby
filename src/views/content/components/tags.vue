<template>
  <n-space v-if="labels.length" class="ml-3">
    <n-tag
      class="group/tag px-2"
      v-for="tag in labels"
      :key="tag.id"
      size="small"
      :color="{
        color: `${tag.color}33`,
        textColor: tag.color,
        borderColor: `${tag.color}4A`,
      }"
    >
      <div class="flex items-center">
        {{ tag.title }}
        <n-icon-wrapper
          border-radius="10"
          icon-color="#fff"
          size="12"
          class="absolute -right-1 -top-1 z-10 hidden cursor-pointer group-hover/tag:block"
          @click.stop="onDeleteTagFromCollection(tag.id)"
        >
          <n-icon :component="Close" />
        </n-icon-wrapper>
      </div>
    </n-tag>
  </n-space>
</template>

<script setup lang="ts">
import DataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { Label } from "@/type.ts"
import { Close } from "@vicons/ionicons5"

const props = defineProps<{
  labels: Label[]
  collectionId: number
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()
const onDeleteTagFromCollection = async (tagId: number) => {
  await dataManager.removeTagforCollection(props.collectionId, tagId)
  await refreshCollections()
}
</script>
