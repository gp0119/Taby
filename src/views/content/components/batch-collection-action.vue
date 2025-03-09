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
              {{
                gt(
                  "select-collections",
                  batchCollectionStore.selectedCollectionIds.length,
                )
              }}
            </span>
            <n-button secondary type="primary" @click="onHandleMove">
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
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="tsx">
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useDraggableStore } from "@/store/draggable.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { movePosition } from "@/type.ts"
import { ref } from "vue"
import { useBatchCollectionStore } from "@/store/batch-collection.ts"
import { FolderMoveTo, Delete, Close } from "@vicons/carbon"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"

const show = ref(false)
const batchCollectionStore = useBatchCollectionStore()
const draggableStore = useDraggableStore()

const { refreshCollections } = useRefresh()
const spacesStore = useSpacesStore()
const { ft, gt } = useHelpi18n()

const closeDrawer = () => {
  show.value = false
  batchCollectionStore.clearSelectedCollectionIds()
}

watch(
  () => batchCollectionStore.selectedCollectionIds.length,
  () => {
    console.log(111)
    show.value = batchCollectionStore.selectedCollectionIds.length > 0
  },
)

const { open } = useEditDialog()
const { open: onDeleteComfirm } = useDeleteDialog()
const onHandleMove = () => {
  const formModel = ref<{
    spaceId: number | null
    position: movePosition
  }>({
    spaceId: spacesStore.activeId,
    position: "END",
  })
  open({
    title: ft("move"),
    renderContent: () => {
      return (
        <n-form model={formModel.value}>
          <n-form-item label={`${ft("space")}:`}>
            <space-select v-model:value={formModel.value.spaceId} />
          </n-form-item>
          <n-form-item label={`${ft("position")}:`}>
            <n-radio-group
              class="w-full"
              v-model:value={formModel.value.position}
            >
              <n-radio-button class="w-1/2 text-center" value="HEAD">
                {ft("move-to-head")}
              </n-radio-button>
              <n-radio-button class="w-1/2 text-center" value="END">
                {ft("move-to-end")}
              </n-radio-button>
            </n-radio-group>
          </n-form-item>
        </n-form>
      )
    },
    onPositiveClick: async () => {
      if (!formModel.value.spaceId) return
      await dataManager.batchUpdateCollections(
        batchCollectionStore.selectedCollectionIds,
        {
          spaceId: formModel.value.spaceId!,
        },
        formModel.value.position,
      )
      await refreshCollections()
      draggableStore.setDraggable(false)
      closeDrawer()
    },
  })
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
</script>
