<template>
  <div
    class="flex h-[50px] justify-between border-0 border-b border-solid px-4"
  >
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
          {{
            !expandStore.isCollapseAll ? ft("expand-all") : ft("collapse-all")
          }}
        </div>
      </n-button>
      <!--   更多   -->
      <n-popover
        trigger="hover"
        :show-arrow="false"
        placement="bottom"
        @update:show="showMore = $event"
      >
        <template #trigger>
          <n-button quaternary :focusable="false" type="primary" class="!px-2">
            <template #icon>
              <n-icon size="20">
                <List />
              </n-icon>
            </template>
            <span class="leading-6">{{ ft("more") }}</span>
            <n-icon
              size="20"
              class="transition-transform duration-300"
              :class="{ 'rotate-90': showMore }"
              :component="ChevronRight"
            />
          </n-button>
        </template>
        <template #default>
          <div class="flex flex-col items-start gap-y-2 py-1.5">
            <!--   拖拽   -->
            <n-switch
              v-model:value="draggableStore.draggable"
              :round="false"
              @update-value="onToggleDraggable"
            >
              <template #checked-icon>
                <n-icon size="12" :component="BanOutline" />
              </template>
              <template #unchecked-icon>
                <n-icon size="12" :component="Move" />
              </template>
              <template #checked>
                {{ ft("disable-drag") }}
              </template>
              <template #unchecked>
                {{ ft("enable-drag") }}
              </template>
            </n-switch>
            <!--   查找重复   -->
            <n-switch
              v-model:value="duplicateCardStore.isFindDuplicate"
              :round="false"
              @update-value="onToggleFindDuplicate"
            >
              <template #checked-icon>
                <n-icon size="12" :component="ViewOff" />
              </template>
              <template #unchecked-icon>
                <n-icon size="12" :component="View" />
              </template>
              <template #checked>
                {{ ft("disable-duplicate") }}
              </template>
              <template #unchecked>
                {{ ft("enable-duplicate") }}
              </template>
            </n-switch>
          </div>
        </template>
      </n-popover>
    </div>
    <div class="flex-center gap-2">
      <n-button size="small" tertiary class="!shadow" @click="onAddCollection">
        <span>{{ ft("add", "collection") }}</span>
        <template #icon>
          <n-icon size="20" :component="Add" />
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
import { SelectGroupOption, SelectOption } from "naive-ui"
import {
  TagGroup,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  RowExpand,
  RowCollapse,
  List,
  Draggable,
  Add,
  Move,
  View,
  ViewOff,
} from "@vicons/carbon"
import { BanOutline } from "@vicons/ionicons5"
import { useExpandStore } from "@/store/expand"
import { Label, movePosition } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useEditDialog } from "@/hooks/useEditDialog"
import Tag from "@/components/tag.vue"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useBatchCardStore } from "@/store/batch-card"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchTabsStore } from "@/store/batch-tabs"

const batchCardStore = useBatchCardStore()
const batchCollectionStore = useBatchCollectionStore()
const batchTabsStore = useBatchTabsStore()

const draggableStore = useDraggableStore()
const duplicateCardStore = useDuplicateCardStore()
const tagsStore = useTagsStore()
const sortStore = useSortStore()
const expandStore = useExpandStore()
const { ft } = useHelpi18n()

const showMore = ref(false)
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

const onToggleDraggable = (value: boolean) => {
  draggableStore.setDraggable(value)
  if (value) {
    batchCardStore.clearSelectedCardIds()
    batchCollectionStore.clearSelectedCollectionIds()
    batchTabsStore.clearSelectedTabs()
  }
}

const onToggleFindDuplicate = (value: boolean) => {
  duplicateCardStore.setIsFindDuplicate(value)
  if (value) {
    batchCardStore.clearSelectedCardIds()
    batchCollectionStore.clearSelectedCollectionIds()
    batchTabsStore.clearSelectedTabs()
  }
}
</script>
