<template>
  <div
    class="collection-actions hidden items-center gap-x-2 group-hover/item:flex"
    :class="{
      '!flex':
        isShowTagAction ||
        isShowMoveAction ||
        isShowMoreAction ||
        isShowDeleteAction ||
        !canHover,
    }"
  >
    <n-popover
      :show="isShowMoreAction || isShowDeleteAction"
      :trigger="canHover ? 'hover' : 'click'"
      placement="bottom-end"
      :show-arrow="false"
      class="!rounded-xl"
      style="padding: 0"
      @update:show="isShowMoreAction = $event"
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
          <n-icon size="18">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="13" width="16" height="7" rx="2" />
              <path d="M12 4v6M9 7h6" />
            </svg>
          </n-icon>
          <span>{{ ft("add-before") }}</span>
        </div>
        <div
          class="more-menu-item text-text-primary"
          @click="onAddCollectionBeside(item, 'after')"
        >
          <n-icon size="18">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="4" width="16" height="7" rx="2" />
              <path d="M12 14v6M9 17h6" />
            </svg>
          </n-icon>
          <span>{{ ft("add-after") }}</span>
        </div>
        <DeletePopconfirm
          v-model:show="isShowDeleteAction"
          placement="bottom-end"
          :name="item.title"
          :confirm="() => onDeleteCollection(item)"
        >
          <div class="more-menu-item text-error-color">
            <n-icon size="18" :component="TrashOutline" />
            <span>{{ ft("delete") }}</span>
          </div>
        </DeletePopconfirm>
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

<script setup lang="ts">
import { CollectionWithCards, movePosition } from "@/type.ts"
import { FolderMoveTo } from "@vicons/carbon"
import { EllipsisVerticalSharp, TrashOutline } from "@vicons/ionicons5"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import TagAction from "./tag-action.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import DeletePopconfirm from "@/components/delete-popconfirm.vue"
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
const isShowDeleteAction = ref(false)

provide("isShowTagAction", {
  isShowTagAction,
  setIsShowTagAction: (value: boolean) => {
    isShowTagAction.value = value
  },
})

const spacesStore = useSpacesStore()

function onAddCollectionBeside(
  item: CollectionWithCards,
  side: "before" | "after",
) {
  isShowMoreAction.value = false
  spacesStore.startDraftCollection(ft("untitled"), item.id, side)
}

async function onDeleteCollection(item: CollectionWithCards) {
  isShowMoreAction.value = false
  await dataManager.removeCollection(item.id)
  await updateContextMenus()
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
