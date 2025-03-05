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
        class="fixed bottom-3 left-1/2 z-10 w-[800px] -translate-x-1/2 rounded-xl bg-card-color shadow-base-lg transition-all duration-300 ease-in-out"
      >
        <div class="relative px-4 py-6">
          <n-icon
            class="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
            :size="24"
            :component="Close"
            @click="closeDrawer"
          />
          <div class="flex-center gap-3">
            <span class="text-lg text-text-secondary">
              Select {{ batchSelectStore.selectedCardIds.length }} Tags
            </span>
            <n-button secondary type="primary" @click="onHandleMove">
              <template #icon>
                <n-icon :size="16" :component="FolderMoveTo" />
              </template>
              Move
            </n-button>
            <n-button secondary type="error" @click="onHandleDelete">
              <template #icon>
                <n-icon :size="16" :component="Delete" />
              </template>
              Delete
            </n-button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="tsx">
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { movePosition } from "@/type.ts"
import { ref } from "vue"
import { useBatchSelectStore } from "@/store/batch-select"
import { FolderMoveTo, Delete, Close } from "@vicons/carbon"
import DataManager from "@/db"

const show = ref(false)
const batchSelectStore = useBatchSelectStore()
const dataManager = new DataManager()
const { refreshCollections } = useRefresh()
const spacesStore = useSpacesStore()

const closeDrawer = () => {
  show.value = false
  batchSelectStore.clearSelectedCardIds()
}

watch(
  () => batchSelectStore.selectedCardIds.length,
  () => {
    show.value = batchSelectStore.selectedCardIds.length > 0
  },
)

const { open } = useEditDialog()
const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleMove = () => {
  const formModel = ref<{
    spaceId: number | null
    collectionId: number | null
    position: movePosition
  }>({
    spaceId: spacesStore.activeId,
    collectionId: null,
    position: "END",
  })
  open({
    title: "Move",
    renderContenr: () => {
      return (
        <n-form model={formModel.value}>
          <n-form-item label="Space">
            <space-select v-model:value={formModel.value.spaceId} />
          </n-form-item>
          <n-form-item label="Collection">
            <collection-select
              v-model:value={formModel.value.collectionId}
              space-id={formModel.value.spaceId}
            />
          </n-form-item>
          <n-form-item label="Position">
            <n-radio-group
              class="w-full"
              v-model:value={formModel.value.position}
            >
              <n-radio-button class="w-1/2 text-center" value="HEAD">
                Move to the HEAD
              </n-radio-button>
              <n-radio-button class="w-1/2 text-center" value="END">
                Move to the END
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
        </n-form>
      )
    },
    onPositiveClick: async () => {
      if (!formModel.value.collectionId) return
      await dataManager.batchUpdateCards(
        batchSelectStore.selectedCardIds,
        {
          collectionId: formModel.value.collectionId!,
        },
        formModel.value.position,
      )
      await refreshCollections()
      closeDrawer()
    },
  })
}

const onHandleDelete = async () => {
  onDeleteComfirm({
    title: "Delete",
    content: "Are you sure you want to delete these tags?",
    onPositiveClick: async () => {
      await dataManager.batchDeleteCards(batchSelectStore.selectedCardIds)
      await refreshCollections()
      closeDrawer()
    },
  })
}
</script>
