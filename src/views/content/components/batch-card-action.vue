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
      <DeletePopconfirm
        :content="ft('delete-cards-confirm')"
        :confirm="onHandleDelete"
      >
        <n-button ghost type="error">
          <template #icon>
            <n-icon :size="16" :component="TrashOutline" />
          </template>
          {{ ft("delete") }}
        </n-button>
      </DeletePopconfirm>
    </div>
  </bottom-action>
</template>

<script setup lang="ts">
import DeletePopconfirm from "@/components/delete-popconfirm.vue"
import { useBatchCardStore } from "@/store/batch-card"
import { FolderMoveTo } from "@vicons/carbon"
import { TrashOutline } from "@vicons/ionicons5"
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

const onHandleDelete = async () => {
  await dataManager.batchDeleteCards(batchCardStore.selectedCardIds)
  closeDrawer()
}
</script>
