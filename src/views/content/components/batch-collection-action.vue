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
      <n-button tertiary @click="onHandleMove">
        <template #icon>
          <n-icon :size="16" :component="FolderMoveTo" />
        </template>
        {{ ft("move") }}
      </n-button>
      <n-button
        tertiary
        :disabled="batchCollectionStore.selectedCollectionIds.length < 2"
        @click="onHandleMerge"
      >
        <template #icon>
          <n-icon :size="16" :component="DirectionMerge" />
        </template>
        {{ ft("merge") }}
      </n-button>
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
import { useBatchMoveCollectionDialog } from "@/hooks/useBatchMoveCollectionDialog.tsx"
import { useBatchMoveCardDialog } from "@/hooks/useBatchMoveCardDialog.tsx"
import bottomAction from "@/components/bottom-action.vue"
import { useAnimatedPresence } from "@/hooks/useAnimatedPresence"

const batchCollectionStore = useBatchCollectionStore()
const { show, animated, onAnimationEnd } = useAnimatedPresence(
  () => batchCollectionStore.selectedCollectionIds.length,
)

const { refreshCollections, updateContextMenus } = useRefresh()
const { ft } = useHelpi18n()

const onClose = () => {
  batchCollectionStore.clearSelectedCollectionIds()
}

const closeDrawer = () => {
  batchCollectionStore.clearSelectedCollectionIds()
}

const { open: onDeleteComfirm } = useDeleteDialog()
const { openDialog: openMoveDialog } = useBatchMoveCollectionDialog()
const { openDialog: openMergeDialog } = useBatchMoveCardDialog()

const onHandleMove = async () => {
  const { spaceId, position } = await openMoveDialog()
  await dataManager.batchUpdateCollections(
    batchCollectionStore.selectedCollectionIds,
    { spaceId: spaceId! },
    position,
  )
  await refreshCollections()
  await refreshCollections(spaceId as number)
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
      await refreshCollections()
      await updateContextMenus()
      closeDrawer()
    },
  })
}

const onHandleMerge = async () => {
  const { collectionId, position } = await openMergeDialog(ft("merge-to"))
  const cards = await dataManager.getCardWithCollectionIds(
    batchCollectionStore.selectedCollectionIds,
  )
  const cardIds = cards.map((card) => card.id)
  await dataManager.batchUpdateCards(
    cardIds,
    { collectionId: collectionId! },
    position,
  )
  await refreshCollections()
  await updateContextMenus()
  closeDrawer()
}
</script>
