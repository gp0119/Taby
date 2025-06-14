<template>
  <n-popover
    trigger="click"
    :show="showPopover"
    placement="bottom-start"
    :show-arrow="false"
    :to="false"
    :on-clickoutside="() => (showPopover = false)"
    style="padding: 0; overflow: hidden; width: 200px"
  >
    <template #trigger>
      <div
        class="flex h-10 w-10 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border-[3px] border-body-color"
        :class="[active == windowId ? '!border-primary' : 'hover:opacity-75']"
        @click="handleClick(windowId)"
        @contextmenu="onHandleContextMenu"
      >
        <div
          class="flex items-center justify-center gap-1 bg-content-color px-0.5 py-1"
        >
          <span class="h-1 w-1 rounded-full bg-gray-400" />
          <span class="h-1 w-1 rounded-full bg-gray-400" />
          <span class="h-1 w-1 rounded-full bg-gray-400" />
        </div>
        <div
          class="flex flex-1 select-none items-center justify-center bg-hover-color font-bold text-gray-400"
        >
          {{ tabCount }}
        </div>
      </div>
    </template>
    <template #default>
      <div
        class="cursor-pointer px-4 py-2 hover:bg-content-color"
        @click="onSaveAllTabs(windowId)"
      >
        {{ ft("save-all-tabs") }}
      </div>
      <div
        class="cursor-pointer px-4 py-2 hover:bg-content-color"
        @click="onSaveAllTabsAndClose(windowId)"
      >
        {{ ft("save-all-tabs-and-close") }}
      </div>
      <div
        class="cursor-pointer px-4 py-2 hover:bg-content-color"
        @click="onCloseDuplicateTabs(windowId)"
      >
        {{ ft("close-duplicate-tabs") }}
      </div>
      <div
        class="cursor-pointer px-4 py-2 text-red-500 hover:bg-content-color"
        @click="onCloseAllTabs(windowId)"
      >
        {{ ft("close-all-tabs") }}
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="ts">
import { Card } from "@/type.ts"
import { ref, onMounted, onUnmounted } from "vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useLayoutStore } from "@/store/layout"
import { isNewTabPage } from "@/utils"

const layoutStore = useLayoutStore()
const wrapperRef = ref<HTMLDivElement | null>(null)
const { ft } = useHelpi18n()
const showPopover = ref(false)

watchEffect(async () => {
  if (
    layoutStore.rightLayoutMode === "hover" &&
    !layoutStore.rightLayoutHovering
  ) {
    await nextTick()
    showPopover.value = false
  }
})

function onWheel(e: WheelEvent) {
  const el = wrapperRef.value
  if (!el) return
  if (e.deltaY !== 0) {
    el.scrollLeft += e.deltaY
    e.preventDefault()
  }
}

function onHandleContextMenu(e: MouseEvent) {
  e.preventDefault()
  showPopover.value = true
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

const props = defineProps<{
  tab: Card[]
  active: number | string
  windowId: number | string
  index: number
}>()

const tabCount = computed(() => {
  return props.tab.filter((tab) => !isNewTabPage(tab.url)).length
})

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
  showPopover.value = false
}

const onSaveAllTabs = (windowId: number | string) => {
  emit("saveAllTabs", Number(windowId))
  showPopover.value = false
}

const onSaveAllTabsAndClose = (windowId: number | string) => {
  emit("saveAllTabsAndClose", Number(windowId))
  showPopover.value = false
}

const onCloseDuplicateTabs = (windowId: number | string) => {
  emit("closeDuplicateTabs", Number(windowId))
  showPopover.value = false
}
</script>
