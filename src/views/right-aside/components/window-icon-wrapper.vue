<template>
  <div
    ref="wrapperRef"
    class="scrollbar-thin mb-2 flex w-full items-center gap-x-2 overflow-x-auto px-2.5 pt-1.5"
  >
    <div
      v-for="(_item, windowId, index) in tabs"
      :key="windowId"
      class="flex h-10 w-10 flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border-[3px]"
      :class="{
        'border-primary': active == windowId,
      }"
      @click="handleClick(windowId)"
    >
      <div
        class="flex items-center justify-center gap-0.5 bg-content-bg px-0.5 py-1"
      >
        <span class="h-1 w-1 rounded-full bg-gray-400" />
        <span class="h-1 w-1 rounded-full bg-gray-400" />
        <span class="h-1 w-1 rounded-full bg-gray-400" />
      </div>
      <div
        class="flex flex-1 items-center justify-center bg-white font-bold text-gray-400"
      >
        {{ index + 1 }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from "@/type.ts"
import { ref, onMounted, onUnmounted } from "vue"

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
}>()

function handleClick(windowId: number | string) {
  emit("update:active", Number(windowId))
}
</script>
