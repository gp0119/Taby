<template>
  <div
    class="flex h-[50px] justify-between border-0 border-b border-solid px-4"
  >
    <div class="flex-center">
      <!--   排序   -->
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
            <n-icon
              size="20"
              v-if="
                sortStore.sortOrder === 'title-desc' ||
                sortStore.sortOrder === 'created-at-desc'
              "
            >
              <ChevronSortUp />
            </n-icon>
            <n-icon
              size="20"
              v-else-if="
                sortStore.sortOrder === 'title-asc' ||
                sortStore.sortOrder === 'created-at-asc'
              "
            >
              <ChevronSortDown />
            </n-icon>
            <n-icon size="20" v-else>
              <ChevronSort />
            </n-icon>
          </template>
          <span class="w-[60px] text-ellipsis leading-6">{{
            ft(sortStore.sortOrder ?? "draggable")
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
      <!--   标签   -->
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
            <Tag
              titleClass="w-[50px] text-ellipsis"
              :tag="tagsStore.selectedTag"
              :closeable="false"
            />
          </template>
          <template v-else>
            <div class="w-[60px] text-ellipsis">{{ ft("tag-filter") }}</div>
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
      <!--   展开   -->
      <n-button quaternary type="primary" @click="expandStore.expandAll">
        <template #icon>
          <n-icon size="20">
            <RowExpand />
          </n-icon>
        </template>
        {{ ft("expand-all") }}
      </n-button>

      <n-button quaternary type="primary" @click="expandStore.collapseAll">
        <template #icon>
          <n-icon size="20">
            <RowCollapse />
          </n-icon>
        </template>
        {{ ft("collapse-all") }}
      </n-button>
      <n-switch
        v-model:value="draggableStore.draggable"
        @update-value="draggableStore.setDraggable"
      >
        <template #checked>
          <span class="text-xs">{{ ft("disable-drag") }}</span>
        </template>
        <template #unchecked>
          <span class="text-xs">{{ ft("enable-drag") }}</span>
        </template>
      </n-switch>
    </div>
    <div class="flex-center gap-2">
      <n-button size="small" secondary type="primary" @click="onAddCollection">
        <span>{{ ft("add", "collection") }}</span>
        <template #icon>
          <n-icon>
            <Add />
          </n-icon>
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="tsx">
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useDraggableStore } from "@/store/draggable.ts"
import { useSortStore } from "@/store/sort.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { useTagsStore } from "@/store/tags.ts"
import { Add } from "@vicons/ionicons5"
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
import { Label, movePosition } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useEditDialog } from "@/hooks/useEditDialog"
import Tag from "@/components/tag.vue"

const draggableStore = useDraggableStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const expandStore = useExpandStore()
const { ft } = useHelpi18n()

const renderTagLabel = (option: SelectOption | SelectGroupOption) => {
  return <Tag tag={option as unknown as Label} />
}

const renderSortLabel = (option: SelectOption | SelectGroupOption) => {
  return (
    <span>
      {option.key === "title-desc" || option.key === "created-at-desc" ? (
        <n-icon size="12" component={ArrowUp} />
      ) : option.key === "title-asc" || option.key === "created-at-asc" ? (
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

const spacesStore = useSpacesStore()

const { refreshCollections } = useRefresh()
const { open } = useEditDialog()
function onAddCollection() {
  const formModel = ref<{
    title: string
    position: movePosition
  }>({ title: "", position: "END" })
  open({
    title: ft("add", "collection"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`}>
          <n-input
            v-model:value={formModel.value.title}
            placeholder={ft("placeholder", "title")}
          />
        </n-form-item>
        <n-form-item label={`${ft("position")}:`}>
          <n-radio-group
            class="w-full"
            v-model:value={formModel.value.position}
          >
            <n-radio-button class="w-1/2 text-center" value="HEAD">
              {ft("move-to-head")}
            </n-radio-button>
            <n-radio-button class="w-1/2 text-center" value="END">
              {ft("move-to-end")}
            </n-radio-button>
          </n-radio-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.addCollection(
        {
          title: formModel.value.title,
          spaceId: spacesStore.activeId,
          labelIds: [],
        },
        formModel.value.position,
      )
      await refreshCollections()
    },
  })
}
</script>
