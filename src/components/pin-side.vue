<template>
  <div
    class="relative z-10 h-full translate-x-0 px-2"
    :style="{
      width: `${collapsed ? collapsedWidth : width}px`,
      transition: 'all 0.2s ease-in-out',
      padding: collapsed ? '0 0' : '0 8px',
    }"
    @mouseleave="handleMouseAction('leave')"
  >
    <aside
      class="flex h-full flex-col gap-y-2 py-2"
      :class="{
        collapsed: collapsed,
        pinned: pinned,
      }"
      @mouseenter="handleMouseAction('enter')"
    >
      <div
        v-if="$slots.header"
        class="rounded-lg"
        :class="[
          !collapsed ? 'bg-white' : 'bg-transparent',
          'transition-colors duration-300 ease-in-out',
        ]"
      >
        <slot name="header" />
      </div>
      <div
        class="flex-1 rounded-lg"
        :class="[
          !collapsed ? 'bg-white' : 'bg-transparent',
          'transition-colors duration-300 ease-in-out',
        ]"
      >
        <slot />
      </div>
      <div
        v-if="$slots.footer"
        class="rounded-lg p-[13px]"
        :class="[
          !collapsed ? 'bg-white' : 'bg-transparent',
          'transition-colors duration-300 ease-in-out',
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
      v-if="!collapsed && !pinned"
      class="absolute top-0 z-[99999] h-full w-4"
      :class="{
        '-right-4': side === 'left',
        '-left-4': side === 'right',
      }"
      style="background: transparent"
    />
  </div>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es"

const props = withDefaults(
  defineProps<{
    side: "left" | "right"
    collapsed: boolean
    collapsedWidth?: number
    width?: number
    pinned?: boolean
  }>(),
  {
    collapsedWidth: 60,
    width: 220,
    pinned: false,
  },
)

const emit = defineEmits<{
  (e: "update:collapsed", collapsed: boolean): void
}>()

const handleMouseAction = debounce((type: "enter" | "leave") => {
  if (props.pinned) return
  if (type === "enter") {
    emit("update:collapsed", false)
  } else {
    emit("update:collapsed", true)
  }
}, 60)
</script>
