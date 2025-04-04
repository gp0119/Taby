<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-all duration-300 ease-in-out"
      leave-active-class="transition-all duration-300 ease-in-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="show"
        class="pointer-events-auto fixed bottom-3 left-1/2 z-10 w-[480px] -translate-x-1/2 cursor-move rounded-xl bg-card-color shadow-base-lg"
        @mousedown="onMouseDown"
        :style="{
          left: clientX,
        }"
      >
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div
              class="select-none font-medium text-text-secondary"
              v-html="
                gt(
                  'select-collections',
                  batchCollectionStore.selectedCollectionIds.length,
                )
              "
            />
            <n-icon
              class="cursor-pointer text-gray-400"
              :size="20"
              :component="Close"
              @click="closeDrawer"
            />
          </div>

          <div class="mt-4 flex w-full gap-x-3">
            <n-button
              secondary
              class="flex-1"
              type="primary"
              @click="onHandleMove"
            >
              <template #icon>
                <n-icon :size="16" :component="FolderMoveTo" />
              </template>
              {{ ft("move") }}
            </n-button>
            <n-button
              secondary
              class="flex-1"
              type="primary"
              :disabled="batchCollectionStore.selectedCollectionIds.length < 2"
              @click="onHandleMerge"
            >
              <template #icon>
                <n-icon :size="16" :component="DirectionMerge" />
              </template>
              {{ ft("merge") }}
            </n-button>
            <n-button
              secondary
              class="flex-1"
              type="error"
              @click="onHandleDelete"
            >
              <template #icon>
                <n-icon :size="16" :component="Delete" />
              </template>
              {{ ft("delete") }}
            </n-button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="tsx">
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useDraggableStore } from "@/store/draggable.ts"
import { ref } from "vue"
import { useBatchCollectionStore } from "@/store/batch-collection.ts"
import { FolderMoveTo, Delete, Close, DirectionMerge } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { throttle } from "lodash-es"
import { useBatchMoveCollectionDialog } from "@/hooks/useBatchMoveCollectionDialog.tsx"
import { useBatchMoveCardDialog } from "@/hooks/useBatchMoveCardDialog.tsx"

const show = ref(false)
const batchCollectionStore = useBatchCollectionStore()
const draggableStore = useDraggableStore()

const { refreshCollections } = useRefresh()
const { ft, gt } = useHelpi18n()

const closeDrawer = () => {
  show.value = false
  batchCollectionStore.clearSelectedCollectionIds()
}

watch(
  () => batchCollectionStore.selectedCollectionIds.length,
  () => {
    show.value = batchCollectionStore.selectedCollectionIds.length > 0
  },
)

const clientX = ref("50%")
const onMouseDown = (e: MouseEvent) => {
  const startX = e.clientX
  const startLeft =
    clientX.value === "50%" ? window.innerWidth / 2 : parseInt(clientX.value)

  const onMouseMove = throttle((e: MouseEvent) => {
    const deltaX = e.clientX - startX
    let newLeft = startLeft + deltaX

    const halfWidth = 240
    const minX = halfWidth
    const maxX = window.innerWidth - halfWidth

    if (newLeft < minX) newLeft = minX
    if (newLeft > maxX) newLeft = maxX

    clientX.value = `${newLeft}px`
  }, 16)

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
  }

  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
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
  draggableStore.setDraggable(false)
  closeDrawer()
}

const onHandleDelete = async () => {
  onDeleteComfirm({
    title: ft("delete", "tags"),
    content: ft("delete-cards-confirm"),
    onPositiveClick: async () => {
      await dataManager.batchDeleteCollections(
        batchCollectionStore.selectedCollectionIds,
      )
      await refreshCollections()
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
  closeDrawer()
}
</script>
