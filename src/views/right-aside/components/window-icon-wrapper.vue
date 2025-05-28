<template>
  <div
    ref="wrapperRef"
    class="scrollbar-thin mb-3 flex w-full items-center gap-x-2 overflow-x-auto px-2.5 pt-1.5"
  >
    <WindowIcon
      v-for="(_item, windowId, index) in tabs"
      :key="windowId"
      :tab="tabs[windowId]"
      :active="active"
      :window-id="windowId"
      :index="index"
      @update:active="handleClick"
      @close-all-tabs="onCloseAllTabs"
      @save-all-tabs="onSaveAllTabs"
      @save-all-tabs-and-close="onSaveAllTabsAndClose"
      @close-duplicate-tabs="onCloseDuplicateTabs"
    />
  </div>
</template>

<script setup lang="ts">
import { Card } from "@/type.ts"
import { ref, onMounted, onUnmounted } from "vue"
import WindowIcon from "@/views/right-aside/components/window-icon.vue"

const wrapperRef = ref<HTMLDivElement | null>(null)

function onWheel(e: WheelEvent) {
  const el = wrapperRef.value
  if (!el) return
  if (e.deltaY !== 0) {
    el.scrollLeft += e.deltaY
    e.preventDefault()
  }
}

onMounted(() => {
  const el = wrapperRef.value
  if (!el) return
  el.addEventListener("wheel", onWheel, { passive: false })
})

onUnmounted(() => {
  const el = wrapperRef.value
  if (!el) return
  el.removeEventListener("wheel", onWheel)
})

defineProps<{
  tabs: {
    [key: string]: Card[]
  }
  active: number | string
}>()

const emit = defineEmits<{
  (e: "update:active", windowId: number): void
  (e: "closeAllTabs", windowId: number): void
  (e: "saveAllTabs", windowId: number): void
  (e: "saveAllTabsAndClose", windowId: number): void
  (e: "closeDuplicateTabs", windowId: number): void
}>()

function handleClick(windowId: number | string) {
  emit("update:active", Number(windowId))
}

const onCloseAllTabs = (windowId: number | string) => {
  emit("closeAllTabs", Number(windowId))
}

const onSaveAllTabs = (windowId: number | string) => {
  emit("saveAllTabs", Number(windowId))
}

const onSaveAllTabsAndClose = (windowId: number | string) => {
  emit("saveAllTabsAndClose", Number(windowId))
}

const onCloseDuplicateTabs = (windowId: number | string) => {
  emit("closeDuplicateTabs", Number(windowId))
}
</script>
