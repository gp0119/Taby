<template>
  <bottom-action v-model:show="show" @close="onClose">
    <div
      class="flex-center h-[34px] w-[34px] rounded-lg border-[2px] border-primary text-base"
      :class="{ 'animate-zoom-in-out': animated }"
      @animationend="onAnimationEnd"
    >
      {{ batchCollectionStore.selectedCollectionIds.length }}
    </div>
    <div class="flex items-center justify-between gap-x-4">
      <MovePopover type="collection" placement="top" @select="onHandleMove">
        <n-button tertiary>
          <template #icon>
            <n-icon :size="16" :component="FolderMoveTo" />
          </template>
          {{ ft("move") }}
        </n-button>
      </MovePopover>
      <MovePopover
        type="card"
        placement="top"
        :title="ft('merge-to')"
        @select="onHandleMerge"
      >
        <n-button
          tertiary
          :disabled="batchCollectionStore.selectedCollectionIds.length < 2"
        >
          <template #icon>
            <n-icon :size="16" :component="DirectionMerge" />
          </template>
          {{ ft("merge") }}
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
import { useRefresh } from "@/hooks/useRresh.ts"
import { useBatchCollectionStore } from "@/store/batch-collection.ts"
import { FolderMoveTo, Delete, DirectionMerge } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import bottomAction from "@/components/bottom-action.vue"
import MovePopover from "@/components/move-popover.vue"
import { useAnimatedPresence } from "@/hooks/useAnimatedPresence"
import { movePosition } from "@/type"

const batchCollectionStore = useBatchCollectionStore()
const { show, animated, onAnimationEnd } = useAnimatedPresence(
  () => batchCollectionStore.selectedCollectionIds.length,
)

const { updateContextMenus } = useRefresh()
const { ft } = useHelpi18n()

const onClose = () => {
  batchCollectionStore.clearSelectedCollectionIds()
}

const closeDrawer = () => {
  batchCollectionStore.clearSelectedCollectionIds()
}

const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleMove = async (spaceId: number, position: movePosition) => {
  await dataManager.batchUpdateCollections(
    batchCollectionStore.selectedCollectionIds,
    { spaceId },
    position,
  )
  await updateContextMenus()
  closeDrawer()
}

const onHandleDelete = async () => {
  onDeleteComfirm({
    title: ft("delete", "collections"),
    content: ft("delete-collections-confirm"),
    onPositiveClick: async () => {
      await dataManager.batchDeleteCollections(
        batchCollectionStore.selectedCollectionIds,
      )
      await updateContextMenus()
      closeDrawer()
    },
  })
}

const onHandleMerge = async (collectionId: number, position: movePosition) => {
  const cards = await dataManager.getCardWithCollectionIds(
    batchCollectionStore.selectedCollectionIds,
  )
  const cardIds = cards.map((card) => card.id)
  await dataManager.batchUpdateCards(cardIds, { collectionId }, position)
  await updateContextMenus()
  closeDrawer()
}
</script>
