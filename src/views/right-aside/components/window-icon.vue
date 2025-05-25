<template>
  <n-popover
    trigger="click"
    :show="showPopover"
    placement="bottom-end"
    :show-arrow="false"
    :on-clickoutside="() => (showPopover = false)"
    style="padding: 0; overflow: hidden"
  >
    <template #trigger>
      <div
        class="flex h-10 w-10 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border-[3px]"
        :class="[
          layoutStore.isRightCollapsed
            ? active == windowId
              ? 'group-hover/right-aside:border-primary'
              : 'border-border-color'
            : active == windowId
              ? 'border-primary'
              : 'border-border-color',
        ]"
        @click="handleClick(windowId)"
        @contextmenu="onHandleContextMenu"
      >
        <div
          class="bg-content-color flex items-center justify-center gap-1 px-0.5 py-1"
        >
          <span class="h-1 w-1 rounded-full bg-gray-400" />
          <span class="h-1 w-1 rounded-full bg-gray-400" />
          <span class="h-1 w-1 rounded-full bg-gray-400" />
        </div>
        <div
          class="flex flex-1 select-none items-center justify-center bg-hover-color font-bold text-gray-400"
        >
          {{ index + 1 }}
        </div>
      </div>
    </template>
    <template #default>
      <div
        class="hover:bg-content-color cursor-pointer px-4 py-2"
        @click="onCloseAllTabs(windowId)"
      >
        {{ ft("close-all-tabs") }}
      </div>
      <div class="hover:bg-content-color cursor-pointer px-4 py-2">
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

const wrapperRef = ref<HTMLDivElement | null>(null)
const { ft } = useHelpi18n()
const layoutStore = useLayoutStore()
const showPopover = ref(false)

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

defineProps<{
  tab: Card[]
  active: number | string
  windowId: number | string
  index: number
}>()

const emit = defineEmits<{
  (e: "update:active", windowId: number): void
  (e: "closeAllTabs", windowId: number): void
}>()

function handleClick(windowId: number | string) {
  emit("update:active", Number(windowId))
}

const onCloseAllTabs = (windowId: number | string) => {
  emit("closeAllTabs", Number(windowId))
  showPopover.value = false
}
</script>
