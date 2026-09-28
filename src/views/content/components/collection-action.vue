<template>
  <div
    class="collection-actions hidden items-center gap-x-2 group-hover/item:flex"
    :class="{
      '!flex':
        isShowTagAction || isShowMoveAction || isShowMoreAction || !canHover,
    }"
  >
    <n-popover
      v-model:show="isShowMoreAction"
      :trigger="canHover ? 'hover' : 'click'"
      placement="bottom-end"
      :show-arrow="false"
      class="!rounded-xl"
      content-style="padding: 0;"
    >
      <template #trigger>
        <n-button quaternary size="small" class="w-[28px]">
          <template #icon>
            <n-icon size="18" :component="EllipsisVerticalSharp" />
          </template>
        </n-button>
      </template>
      <div class="flex w-[200px] flex-col gap-y-1 p-1.5">
        <div
          class="more-menu-item text-text-primary"
          @click="onAddCollectionBeside(item, 'before')"
        >
          <n-icon size="18" :component="ArrowUp" />
          <span>{{ ft("add-before") }}</span>
        </div>
        <div
          class="more-menu-item text-text-primary"
          @click="onAddCollectionBeside(item, 'after')"
        >
          <n-icon size="18" :component="ArrowDown" />
          <span>{{ ft("add-after") }}</span>
        </div>
        <div
          class="more-menu-item text-error-color"
          @click="onDeleteCollection(item)"
        >
          <n-icon size="18" :component="Delete" />
          <span>{{ ft("delete") }}</span>
        </div>
      </div>
    </n-popover>
    <MovePopover
      v-model:show="isShowMoveAction"
      type="collection"
      placement="bottom-end"
      :title="gt('move-type-to', item.title)"
      @select="(spaceId, position) => onMoveCollection(item, spaceId, position)"
    >
      <n-button quaternary size="small" class="w-[28px]">
        <template #icon>
          <n-icon :component="FolderMoveTo" size="18" />
        </template>
      </n-button>
    </MovePopover>
    <TagAction :item="item" />
  </div>
</template>

<script setup lang="tsx">
import { CollectionWithCards, movePosition } from "@/type.ts"
import { FolderMoveTo, Delete, ArrowUp, ArrowDown } from "@vicons/carbon"
import { EllipsisVerticalSharp } from "@vicons/ionicons5"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import TagAction from "./tag-action.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import MovePopover from "@/components/move-popover.vue"
import { useCanHover } from "@/hooks/useCanHover"
import { useSpacesStore } from "@/store/spaces"

const { ft, gt } = useHelpi18n()
const canHover = useCanHover()
defineProps<{
  item: CollectionWithCards
}>()

const { updateContextMenus } = useRefresh()
const isShowTagAction = ref(false)
const isShowMoveAction = ref(false)
const isShowMoreAction = ref(false)

provide("isShowTagAction", {
  isShowTagAction,
  setIsShowTagAction: (value: boolean) => {
    isShowTagAction.value = value
  },
})

const { open: openDeleteDialog } = useDeleteDialog()
const spacesStore = useSpacesStore()

function onAddCollectionBeside(
  item: CollectionWithCards,
  side: "before" | "after",
) {
  isShowMoreAction.value = false
  spacesStore.startDraftCollection(ft("untitled"), item.id, side)
}

function onDeleteCollection(item: CollectionWithCards) {
  isShowMoreAction.value = false
  openDeleteDialog({
    title: ft("delete", "collection"),
    content: () => (
      <span class="text-text-primary">
        {ft("delete-confirm-prefix")}
        <span class="text-primary">{item.title}</span>
        {ft("delete-confirm-suffix")}
      </span>
    ),
    onPositiveClick: async () => {
      await dataManager.removeCollection(item.id)
      await updateContextMenus()
    },
  })
}

async function onMoveCollection(
  item: CollectionWithCards,
  spaceId: number,
  position: movePosition,
) {
  await dataManager.batchUpdateCollections([item.id], { spaceId }, position)
  await updateContextMenus()
}
</script>

<style scoped>
.more-menu-item {
  @apply flex h-9 cursor-pointer select-none items-center gap-x-3 rounded-lg px-3 text-[15px] transition-colors duration-200 hover:bg-hover-color;
}
</style>
