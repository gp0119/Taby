<template>
  <bottom-action v-model:show="show" @close="clear">
    <div
      class="flex-center h-[34px] w-[34px] rounded-lg border-[2px] border-primary text-base"
      :class="{ 'animate-zoom-in-out': animated }"
      @animationend="onAnimationEnd"
    >
      {{ batchTabsStore.selectedTabIds.length }}
    </div>

    <div class="flex items-center justify-between gap-x-4">
      <MovePopover
        type="card"
        placement="top"
        :title="ft('save-to')"
        @select="onHandleSave"
      >
        <n-button secondary>
          <template #icon>
            <n-icon :size="16" :component="FolderMoveTo" />
          </template>
          {{ ft("save-tabs") }}
        </n-button>
      </MovePopover>
      <n-button secondary @click="onHandleGroup">
        <template #icon>
          <n-icon :size="16" :component="FolderMoveTo" />
        </template>
        {{ ft("group-tabs") }}
      </n-button>
      <n-button ghost type="error" @click="onHandleClose">
        <template #icon>
          <n-icon :size="16" :component="CloseOutline" />
        </template>
        {{ ft("close-tabs") }}
      </n-button>
    </div>
  </bottom-action>
</template>

<script setup lang="tsx">
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { FolderMoveTo, CloseOutline } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import bottomAction from "@/components/bottom-action.vue"
import MovePopover from "@/components/move-popover.vue"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { movePosition } from "@/type"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import { useAnimatedPresence } from "@/hooks/useAnimatedPresence"

const batchTabsStore = useBatchTabsStore()
const { show, animated, onAnimationEnd } = useAnimatedPresence(
  () => batchTabsStore.selectedTabIds.length,
)
const { ft } = useHelpi18n()
const { removeTabs, getTabs, groupTabs } = useChromeTabs()

const clear = () => {
  batchTabsStore.clearSelectedTabs()
}

const closeDrawer = () => {
  clear()
}

const onHandleSave = async (collectionId: number, position: movePosition) => {
  await dataManager.saveTabsToCollection(
    batchTabsStore.selectedTab,
    collectionId,
    position,
  )
  batchTabsStore.clearSelectedTabs()
  closeDrawer()
}

const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleClose = async () => {
  onDeleteComfirm({
    title: ft("close-tabs"),
    content: ft("close-tabs-confirm"),
    onPositiveClick: async () => {
      await removeTabs(batchTabsStore.selectedTabIds)
      await getTabs()
      batchTabsStore.clearSelectedTabs()
      closeDrawer()
    },
  })
}

const onHandleGroup = async () => {
  await groupTabs(batchTabsStore.selectedTabIds, "untitled")
  batchTabsStore.clearSelectedTabs()
  closeDrawer()
}
</script>
