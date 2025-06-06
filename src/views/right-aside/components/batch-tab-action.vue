<template>
  <bottom-action v-model:show="show" @close="clear">
    <div
      class="flex-center select-none font-medium text-text-secondary"
      v-html="gt('select-tabs', batchTabsStore.selectedTabIds.length)"
    />

    <div class="flex items-center justify-between gap-x-4">
      <n-button secondary @click="onHandleSave">
        <template #icon>
          <n-icon :size="16" :component="FolderMoveTo" />
        </template>
        {{ ft("save-tabs") }}
      </n-button>
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
import { useBatchMoveCardDialog } from "@/hooks/useBatchMoveCardDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import { ref } from "vue"
import { FolderMoveTo, CloseOutline } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import bottomAction from "@/components/bottom-action.vue"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"

const batchTabsStore = useBatchTabsStore()
const show = ref(false)
const { refreshCollections } = useRefresh()
const { ft, gt } = useHelpi18n()
const { removeTabs, getTabs, groupTabs } = useChromeTabs()

const clear = () => {
  batchTabsStore.clearSelectedTabs()
}

const closeDrawer = () => {
  show.value = false
  clear()
}

watch(
  () => batchTabsStore.selectedTabIds.length,
  () => {
    show.value = batchTabsStore.selectedTabIds.length > 0
  },
)

const { openDialog } = useBatchMoveCardDialog()
const onHandleSave = async () => {
  const { collectionId, position } = await openDialog(ft("save-to"))
  const cardIds: number[] = []
  for (const tab of batchTabsStore.selectedTab) {
    const faviconId = await dataManager.addFavicon(tab.favicon)
    const cardId = await dataManager.addCard({
      title: tab.title,
      url: tab.url,
      collectionId: Number(collectionId),
      faviconId: faviconId,
      description: "",
    })
    cardIds.push(cardId)
  }
  await dataManager.batchUpdateCards(
    cardIds,
    { collectionId: collectionId! },
    position,
  )
  await refreshCollections()
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
