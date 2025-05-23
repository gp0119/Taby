<template>
  <bottom-action v-model:show="show" @close="onClose">
    <div
      class="flex-center select-none font-medium text-text-secondary"
      v-html="gt('select-cards', batchCardStore.selectedCardIds.length)"
    />
    <div class="flex items-center justify-between gap-x-4">
      <n-button tertiary @click="onHandleMove">
        <template #icon>
          <n-icon :size="16" :component="FolderMoveTo" />
        </template>
        {{ ft("move") }}
      </n-button>
      <n-button secondary type="error" @click="onHandleDelete">
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
import { useBatchMoveCardDialog } from "@/hooks/useBatchMoveCardDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import { ref } from "vue"
import { useBatchCardStore } from "@/store/batch-card"
import { FolderMoveTo, Delete } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import bottomAction from "@/components/bottom-action.vue"

const batchCardStore = useBatchCardStore()
const show = ref(false)
const { refreshCollections } = useRefresh()
const { ft, gt } = useHelpi18n()

const onClose = () => {
  batchCardStore.clearSelectedCardIds()
}

const closeDrawer = () => {
  show.value = false
  batchCardStore.clearSelectedCardIds()
}

watch(
  () => batchCardStore.selectedCardIds.length,
  () => {
    show.value = batchCardStore.selectedCardIds.length > 0
  },
)

const { openDialog } = useBatchMoveCardDialog()
const onHandleMove = async () => {
  const { collectionId, position, spaceId } = await openDialog()
  await dataManager.batchUpdateCards(
    batchCardStore.selectedCardIds,
    { collectionId: collectionId! },
    position,
  )
  await refreshCollections()
  refreshCollections(spaceId as number)
  closeDrawer()
}

const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleDelete = async () => {
  onDeleteComfirm({
    title: ft("delete", "cards"),
    content: ft("delete-cards-confirm"),
    onPositiveClick: async () => {
      await dataManager.batchDeleteCards(batchCardStore.selectedCardIds)
      await refreshCollections()
      closeDrawer()
    },
  })
}
</script>
