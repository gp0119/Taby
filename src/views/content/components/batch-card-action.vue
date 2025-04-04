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
        class="pointer-events-auto fixed bottom-3 left-1/2 z-10 w-[440px] -translate-x-1/2 cursor-move rounded-xl bg-card-color shadow-base-lg"
        @mousedown="onMouseDown"
        :style="{
          left: clientX,
        }"
      >
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div
              class="select-none text-text-secondary"
              v-html="gt('select-cards', batchCardStore.selectedCardIds.length)"
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
import { useBatchMoveCardDialog } from "@/hooks/useBatchMoveCardDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import { ref } from "vue"
import { useBatchCardStore } from "@/store/batch-card"
import { FolderMoveTo, Delete, Close } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { throttle } from "lodash-es"

const show = ref(false)
const batchCardStore = useBatchCardStore()

const { refreshCollections } = useRefresh()
const { ft, gt } = useHelpi18n()

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

const clientX = ref("50%")
const onMouseDown = (e: MouseEvent) => {
  const startX = e.clientX
  const startLeft =
    clientX.value === "50%" ? window.innerWidth / 2 : parseInt(clientX.value)

  const onMouseMove = throttle((e: MouseEvent) => {
    const deltaX = e.clientX - startX
    let newLeft = startLeft + deltaX

    const halfWidth = 220
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

const { openDialog } = useBatchMoveCardDialog()
const onHandleMove = async () => {
  const { collectionId, position } = await openDialog()
  await dataManager.batchUpdateCards(
    batchCardStore.selectedCardIds,
    { collectionId: collectionId! },
    position,
  )
  await refreshCollections()
  closeDrawer()
}

const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleDelete = async () => {
  onDeleteComfirm({
    title: ft("delete", "tags"),
    content: ft("delete-cards-confirm"),
    onPositiveClick: async () => {
      await dataManager.batchDeleteCards(batchCardStore.selectedCardIds)
      await refreshCollections()
      closeDrawer()
    },
  })
}
</script>
