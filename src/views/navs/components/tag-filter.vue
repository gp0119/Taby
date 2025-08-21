<template>
  <n-popover
    trigger="hover"
    placement="bottom-end"
    :show-arrow="false"
    :show="tagsStore.isTagOpen"
    style="padding: 0"
    @select="handleTagSelect"
    @update:show="onUpdateShow"
  >
    <template #trigger>
      <n-button
        tertiary
        :focusable="false"
        size="small"
        class="!shadow-btn-shadow"
      >
        <template #icon>
          <n-icon size="20">
            <TagGroup />
          </n-icon>
        </template>
        <template v-if="tagsStore.selectedTag">
          <Tag
            title-class="w-[60px] text-ellipsis"
            :tag="tagsStore.selectedTag"
            :closeable="false"
          />
        </template>
        <template v-else>
          <div class="w-[76px] text-ellipsis leading-6">
            {{ ft("tag-filter") }}
          </div>
        </template>
      </n-button>
    </template>
    <template #default>
      <div class="flex flex-col overflow-hidden rounded-lg bg-dialog-color">
        <div
          v-for="tag in tagOptions"
          :key="tag.id"
          class="flex cursor-pointer select-none items-center gap-x-2 px-4 py-2 hover:bg-hover-color"
          @click="handleTagSelect(tag.id, tag)"
        >
          <Tag :tag="tag" />
        </div>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { useTagsStore } from "@/store/tags.ts"
import { TagGroup } from "@vicons/carbon"
import { Label } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import Tag from "@/components/tag.vue"

const tagsStore = useTagsStore()
const { ft } = useHelpi18n()

const tagOptions = computed(() => {
  const options = tagsStore.collectionsTags.map((tag) => ({
    ...tag,
    title: tag.title,
    key: tag.id,
    color: tag.color,
  }))
  options.unshift({
    title: ft("clear-label"),
    id: 0,
    key: 0,
    color: "#000000",
  })
  return options
})

const handleTagSelect = (_key: number, option: Label) => {
  if (option.id === 0) {
    tagsStore.setSelectedTag(null)
    return
  }
  tagsStore.setSelectedTag(option)
  tagsStore.toggleTagOpen()
}

const onUpdateShow = async (show: boolean) => {
  if (show) {
    await tagsStore.fetchCollectionsTags()
  }
  tagsStore.toggleTagOpen(show)
}
</script>
