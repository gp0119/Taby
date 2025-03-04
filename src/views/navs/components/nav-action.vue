<template>
  <div
    class="flex h-[50px] justify-between border-0 border-b border-solid px-4"
  >
    <div class="flex-center">
      <n-dropdown
        trigger="click"
        :options="sortStore.sortOptions"
        @select="handleSortSelect"
        :render-label="renderSortLabel"
        :show="sortStore.isSortOpen"
        @update:show="sortStore.toggleSortOpen"
      >
        <n-button quaternary type="primary">
          <template #icon>
            <n-icon size="20" v-if="sortStore.order === 'desc'">
              <ChevronSortUp />
            </n-icon>
            <n-icon size="20" v-else-if="sortStore.order === 'asc'">
              <ChevronSortDown />
            </n-icon>
            <n-icon size="20" v-else>
              <ChevronSort />
            </n-icon>
          </template>
          <span class="w-[60px] text-ellipsis">{{
            sortStore.sort ?? "Sort"
          }}</span>
          <n-icon
            size="20"
            class="transition-transform duration-300"
            :class="{ 'rotate-90': sortStore.isSortOpen }"
          >
            <ChevronRight />
          </n-icon>
        </n-button>
      </n-dropdown>
      <n-dropdown
        trigger="click"
        :options="tagOptions"
        :render-label="renderTagLabel"
        key-field="id"
        label-field="title"
        @select="handleTagSelect"
        :show="tagsStore.isTagOpen"
        @update:show="tagsStore.toggleTagOpen"
      >
        <n-button quaternary type="primary">
          <template #icon>
            <n-icon size="20" class="mr-1">
              <TagGroup />
            </n-icon>
          </template>
          <template v-if="tagsStore.selectedTag">
            <n-tag
              size="small"
              :color="{
                color: `${tagsStore.selectedTag.color}33`,
                textColor: `${tagsStore.selectedTag.color}`,
                borderColor: `${tagsStore.selectedTag.color}4A`,
              }"
            >
              <div class="w-[46px] text-ellipsis">
                {{ tagsStore.selectedTag.title }}
              </div>
            </n-tag>
          </template>
          <template v-else>
            <div class="w-[60px] text-ellipsis">Tag Filter</div>
          </template>
          <n-icon
            size="20"
            class="transition-transform duration-300"
            :class="{ 'rotate-90': tagsStore.isTagOpen }"
          >
            <ChevronRight />
          </n-icon>
        </n-button>
      </n-dropdown>
      <n-button quaternary type="primary" @click="expandStore.expandAll">
        <template #icon>
          <n-icon size="20">
            <RowExpand />
          </n-icon>
        </template>
        Expand All
      </n-button>
      <n-button quaternary type="primary" @click="expandStore.collapseAll">
        <template #icon>
          <n-icon size="20">
            <RowCollapse />
          </n-icon>
        </template>
        Collapse All
      </n-button>
      <n-switch
        v-model:value="draggableStore.draggable"
        @update-value="draggableStore.setDraggable"
      >
        <template #checked>
          <span class="text-xs">Draggable</span>
        </template>
        <template #unchecked>
          <span class="text-xs">Draggable</span>
        </template>
      </n-switch>
    </div>
    <div class="flex-center gap-2">
      <div
        class="h-[30px] w-[220px] cursor-pointer select-none whitespace-nowrap rounded border bg-card-color px-2 text-xs leading-[30px] text-[#C2C2C2]"
        @click="openModal"
      >
        Press Ctrl/Command + F to search
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { useSearchModal } from "@/hooks/useSearchModal.tsx"
import { useDraggableStore } from "@/store/draggable.ts"
import { useSortStore } from "@/store/sort.ts"
import { useTagsStore } from "@/store/tags.ts"
import { SelectGroupOption, SelectOption } from "naive-ui"
import {
  TagGroup,
  ChevronRight,
  ChevronSort,
  ChevronSortDown,
  ChevronSortUp,
  ArrowUp,
  ArrowDown,
  RowExpand,
  RowCollapse,
} from "@vicons/carbon"
import { useExpandStore } from "@/store/expand"
import { Label } from "@/type"

const { openModal } = useSearchModal()
const draggableStore = useDraggableStore()

const tagsStore = useTagsStore()
const sortStore = useSortStore()
const expandStore = useExpandStore()

const renderTagLabel = (option: SelectOption | SelectGroupOption) => {
  return option.title !== "Clear Filter" ? (
    <n-tag
      size="small"
      color={{
        color: `${option.color}33`,
        textColor: option.color,
        borderColor: `${option.color}4A`,
      }}
    >
      {option.title}
    </n-tag>
  ) : (
    <span class="text-primary">{option.title}</span>
  )
}

const renderSortLabel = (option: SelectOption | SelectGroupOption) => {
  const order = (option.key as string).split("-")[1]
  return (
    <span>
      {order === "desc" ? (
        <n-icon size="12" component={ArrowUp} />
      ) : order === "asc" ? (
        <n-icon size="12" component={ArrowDown} />
      ) : (
        <n-icon size="12" component={ChevronSort} />
      )}
      <span> {option.label}</span>
    </span>
  )
}

const tagOptions = computed(() => {
  const options = tagsStore.collectionsTags.map((tag) => ({
    ...tag,
    title: tag.title,
    key: tag.id,
    color: tag.color,
  }))
  options.unshift({
    title: "Clear Filter",
    id: 0,
    key: 0,
    color: "#000000",
  })
  return options
})

const handleTagSelect = (_key: string, option: Label) => {
  if (option.title === "Clear Filter") {
    tagsStore.setSelectedTag(null)
    return
  }
  tagsStore.setSelectedTag(option)
}

const handleSortSelect = (key: string) => {
  const [sort, order] = key.split("-")
  sortStore.setSort(sort)
  sortStore.setOrder(order ?? null)
}
</script>
