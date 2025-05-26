<template>
  <div
    class="fixed top-0 z-10 h-full translate-x-0 bg-body-color transition-all duration-100 ease-in-out"
    :class="[
      side === 'left' ? 'left-0' : 'right-0',
      mode === 'hover' && hovering ? 'shadow-collection-shadow' : '',
      mode === 'collapse' || (mode === 'hover' && !hovering) ? 'p-0' : 'px-2',
    ]"
    :style="{
      width: `${mode === 'collapse' || (mode === 'hover' && !hovering) ? collapsedWidth : width}px`,
    }"
    @mouseleave="handleMouseAction('leave')"
  >
    <aside
      class="flex h-full flex-col gap-y-2 py-2"
      @mouseenter="handleMouseAction('enter')"
    >
      <div
        class="flex-1 rounded-lg transition-colors duration-300 ease-in-out"
        :class="[
          !(mode === 'collapse' || (mode === 'hover' && !hovering))
            ? 'bg-card-color'
            : 'bg-transparent',
        ]"
      >
        <slot />
      </div>
      <div
        v-if="$slots.footer"
        class="rounded-lg p-[13px] transition-colors duration-300 ease-in-out"
        :class="[
          !(mode === 'collapse' || (mode === 'hover' && !hovering))
            ? 'bg-card-color'
            : 'bg-transparent',
        ]"
      >
        <slot name="footer" />
      </div>
    </aside>
    <!-- <div
      v-if="side === 'left'"
      class="absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize"
      style="background: transparent"
    /> -->
    <div
      v-if="mode === 'hover' && hovering"
      class="absolute top-0 z-[99999] h-full w-10 bg-transparent"
      :class="{
        '-right-10': side === 'left',
        '-left-10': side === 'right',
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es"
import type { layoutMode } from "@/type"

const props = withDefaults(
  defineProps<{
    side: "left" | "right"
    hovering: boolean
    mode: layoutMode
    collapsedWidth?: number
    width?: number
  }>(),
  {
    collapsedWidth: 60,
    width: 220,
  },
)

const emit = defineEmits<{
  (e: "update:hovering", hovering: boolean): void
}>()

const handleMouseAction = debounce((type: "enter" | "leave") => {
  if (props.mode !== "hover") return
  if (type === "enter") {
    emit("update:hovering", true)
  } else {
    emit("update:hovering", false)
  }
}, 120)
</script>
