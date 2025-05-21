<template>
  <div class="flex-center">
    <!--   排序   -->
    <n-dropdown
      trigger="hover"
      :options="sortStore.sortOptions"
      :render-label="renderSortLabel"
      :show="sortStore.isSortOpen"
      @select="handleSortSelect"
      @update:show="sortStore.toggleSortOpen"
    >
      <n-button quaternary :focusable="false" type="primary" class="!px-2">
        <template #icon>
          <n-icon
            v-if="
              sortStore.sortOrder === 'title-desc' ||
              sortStore.sortOrder === 'created-at-desc'
            "
            size="18"
            :component="ArrowUp"
          />
          <n-icon
            v-else-if="
              sortStore.sortOrder === 'title-asc' ||
              sortStore.sortOrder === 'created-at-asc'
            "
            size="18"
            :component="ArrowDown"
          />
          <n-icon v-else size="20" :component="Draggable" />
        </template>
        <span class="w-[60px] text-ellipsis leading-6">
          {{ ft(sortStore.sortOrder ?? "draggable") }}
        </span>
        <n-icon
          size="20"
          class="transition-transform duration-300"
          :class="{ 'rotate-90': sortStore.isSortOpen }"
        >
          <ChevronRight />
        </n-icon>
      </n-button>
    </n-dropdown>
    <!--   标签   -->
    <n-dropdown
      trigger="hover"
      :options="tagOptions"
      :render-label="renderTagLabel"
      key-field="id"
      label-field="title"
      :show="tagsStore.isTagOpen"
      @select="handleTagSelect"
      @update:show="tagsStore.toggleTagOpen"
    >
      <n-button quaternary :focusable="false" type="primary" class="!px-2">
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
          <div class="w-[60px] text-ellipsis leading-6">
            {{ ft("tag-filter") }}
          </div>
        </template>
        <n-icon
          size="20"
          class="transition-transform duration-300"
          :class="{ 'rotate-90': tagsStore.isTagOpen }"
          :component="ChevronRight"
        />
      </n-button>
    </n-dropdown>
    <!--   展开 收起  -->
    <n-button
      quaternary
      :focusable="false"
      type="primary"
      class="!px-2"
      @click="onToggleExpandAll"
    >
      <template #icon>
        <n-icon
          size="20"
          :component="expandStore.isCollapseAll ? RowCollapse : RowExpand"
        />
      </template>
      <div class="w-[60px] text-ellipsis leading-6">
        {{ !expandStore.isCollapseAll ? ft("expand-all") : ft("collapse-all") }}
      </div>
    </n-button>
  </div>
</template>

<script setup lang="tsx">
import { useSortStore } from "@/store/sort.ts"
import { useTagsStore } from "@/store/tags.ts"
import { SelectGroupOption, SelectOption } from "naive-ui"
import {
  TagGroup,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RowExpand,
  RowCollapse,
  Draggable,
} from "@vicons/carbon"
import { useExpandStore } from "@/store/expand"
import { Label } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import Tag from "@/components/tag.vue"

const tagsStore = useTagsStore()
const sortStore = useSortStore()
const expandStore = useExpandStore()
const { ft } = useHelpi18n()

const renderTagLabel = (option: SelectOption | SelectGroupOption) => {
  return <Tag tag={option as unknown as Label} />
}

const renderSortLabel = (option: SelectOption | SelectGroupOption) => {
  return (
    <span class="flex items-center gap-x-1">
      {option.key === "title-desc" || option.key === "created-at-desc" ? (
        <n-icon size="12" component={ArrowUp} />
      ) : option.key === "title-asc" || option.key === "created-at-asc" ? (
        <n-icon size="12" component={ArrowDown} />
      ) : (
        <n-icon size="14" component={Draggable} />
      )}
      <span> {option.label}</span>
    </span>
  )
}

const onToggleExpandAll = () => {
  if (!expandStore.isCollapseAll) {
    expandStore.expandAll()
  } else {
    expandStore.collapseAll()
  }
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

const handleSortSelect = (key: string) => {
  sortStore.setSortOrder(key)
}
</script>
