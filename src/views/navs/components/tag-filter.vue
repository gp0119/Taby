<template>
  <n-dropdown
    trigger="hover"
    :options="tagOptions"
    :render-label="renderTagLabel"
    key-field="id"
    label-field="title"
    placement="bottom-end"
    :show-arrow="true"
    :show="tagsStore.isTagOpen"
    @select="handleTagSelect"
    @update:show="tagsStore.toggleTagOpen"
  >
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
  </n-dropdown>
</template>

<script setup lang="tsx">
import { useTagsStore } from "@/store/tags.ts"
import { SelectGroupOption, SelectOption } from "naive-ui"
import { TagGroup } from "@vicons/carbon"
import { Label } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import Tag from "@/components/tag.vue"

const tagsStore = useTagsStore()
const { ft } = useHelpi18n()

const renderTagLabel = (option: SelectOption | SelectGroupOption) => {
  return <Tag tag={option as unknown as Label} />
}

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

const handleTagSelect = (_key: string, option: Label) => {
  if (option.id === 0) {
    tagsStore.setSelectedTag(null)
    return
  }
  tagsStore.setSelectedTag(option)
}
</script>
