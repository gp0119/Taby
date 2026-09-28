<template>
  <bottom-action v-model:show="show" @close="onClose">
    <div
      class="flex-center h-[34px] w-[34px] rounded-lg border-[2px] border-primary text-base"
      :class="{ 'animate-zoom-in-out': animated }"
      @animationend="onAnimationEnd"
    >
      {{ batchCardStore.selectedCardIds.length }}
    </div>
    <div class="flex items-center justify-between gap-x-4">
      <MovePopover type="card" placement="top" @select="onHandleMove">
        <n-button tertiary>
          <template #icon>
            <n-icon :size="16" :component="FolderMoveTo" />
          </template>
          {{ ft("move") }}
        </n-button>
      </MovePopover>
      <n-button ghost type="error" @click="onHandleDelete">
        <template #icon>
          <n-icon :size="16" :component="Delete" />
        </template>
        {{ ft("delete") }}
      </n-button>
    </div>
  </bottom-action>
</template>

<script setup lang="tsx">
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useBatchCardStore } from "@/store/batch-card"
import { FolderMoveTo, Delete } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import bottomAction from "@/components/bottom-action.vue"
import MovePopover from "@/components/move-popover.vue"
import { useAnimatedPresence } from "@/hooks/useAnimatedPresence"
import { movePosition } from "@/type"

const batchCardStore = useBatchCardStore()
const { show, animated, onAnimationEnd } = useAnimatedPresence(
  () => batchCardStore.selectedCardIds.length,
)
const { ft } = useHelpi18n()

const onClose = () => {
  batchCardStore.clearSelectedCardIds()
}

const closeDrawer = () => {
  batchCardStore.clearSelectedCardIds()
}

const onHandleMove = async (collectionId: number, position: movePosition) => {
  await dataManager.batchUpdateCards(
    batchCardStore.selectedCardIds,
    { collectionId },
    position,
  )
  closeDrawer()
}

const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleDelete = async () => {
  onDeleteComfirm({
    title: ft("delete", "cards"),
    content: ft("delete-cards-confirm"),
    onPositiveClick: async () => {
      await dataManager.batchDeleteCards(batchCardStore.selectedCardIds)
      closeDrawer()
    },
  })
}
</script>
