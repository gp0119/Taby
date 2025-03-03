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
        class="fixed bottom-3 left-1/2 z-10 w-[800px] -translate-x-1/2 rounded-xl bg-card-color shadow-base transition-all duration-300 ease-in-out"
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
              select {{ batchSelectStore.selectedCardIds.length }} tags
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

<script setup lang="ts">
import { ref } from "vue"
import { useBatchSelectStore } from "@/store/batch-select"
import { FolderMoveTo, Delete, Close } from "@vicons/carbon"

const show = ref(false)
const batchSelectStore = useBatchSelectStore()

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

const onHandleDelete = () => {
  console.log("delete")
}

const onHandleMove = () => {
  console.log("move")
}
</script>
