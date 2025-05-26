<template>
  <n-popover
    trigger="hover"
    placement="bottom-start"
    :show-arrow="false"
    style="padding: 0; width: 220px"
  >
    <template #trigger>
      <n-button
        tertiary
        :focusable="false"
        size="small"
        class="w-[28px] !shadow-btn-shadow"
      >
        <template #icon>
          <n-icon size="18" :component="EllipsisVerticalSharp" />
        </template>
      </n-button>
    </template>
    <template #default>
      <div class="flex flex-col overflow-hidden rounded-lg bg-dialog-color">
        <div class="flex flex-col">
          <!--   排序   -->
          <SortSwitch />
          <!--   拖拽   -->
          <div class="flex w-full items-center justify-between px-4 py-2">
            <div class="flex select-none items-center gap-x-2">
              <n-icon-wrapper>
                <n-icon size="18" :component="Move" />
              </n-icon-wrapper>
              <span>{{ ft("enable-drag") }}</span>
            </div>
            <n-switch
              v-model:value="draggableStore.draggable"
              @update-value="onToggleDraggable"
            />
          </div>

          <!--   查找重复   -->
          <div class="flex w-full items-center justify-between px-4 py-2">
            <div class="flex select-none items-center gap-x-2">
              <n-icon-wrapper>
                <n-icon size="18" :component="View" />
              </n-icon-wrapper>
              <span>{{ ft("enable-duplicate") }}</span>
            </div>
            <n-switch
              v-model:value="duplicateCardStore.isFindDuplicate"
              @update-value="onToggleFindDuplicate"
            />
          </div>
        </div>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n.js"
import { useBatchCardStore } from "@/store/batch-card.ts"
import { useBatchCollectionStore } from "@/store/batch-collection.ts"
import { useBatchTabsStore } from "@/store/batch-tabs.ts"
import { useDraggableStore } from "@/store/draggable.js"
import { useDuplicateCardStore } from "@/store/duplicate-card.js"
import SortSwitch from "@/views/navs/components/sort-switch.vue"
import { Move, View } from "@vicons/carbon"
import { EllipsisVerticalSharp } from "@vicons/ionicons5"

const { ft } = useHelpi18n()
const duplicateCardStore = useDuplicateCardStore()
const draggableStore = useDraggableStore()
const batchCardStore = useBatchCardStore()
const batchCollectionStore = useBatchCollectionStore()
const batchTabsStore = useBatchTabsStore()

const onToggleDraggable = (value: boolean) => {
  draggableStore.setDraggable(value)
  if (value) {
    batchCardStore.clearSelectedCardIds()
    batchCollectionStore.clearSelectedCollectionIds()
    batchTabsStore.clearSelectedTabs()
  }
}

const onToggleFindDuplicate = (value: boolean) => {
  duplicateCardStore.setIsFindDuplicate(value)
  if (value) {
    batchCardStore.clearSelectedCardIds()
    batchCollectionStore.clearSelectedCollectionIds()
    batchTabsStore.clearSelectedTabs()
  }
}
</script>
