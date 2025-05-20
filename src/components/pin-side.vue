<template>
  <div
    class="relative h-full translate-x-0"
    :style="{
      width:
        side === 'left'
          ? layoutStore.leftAsideWidth + 'px'
          : layoutStore.rightAsideWidth + 'px',
      transition: 'width 0.2s ease-in-out',
    }"
    :class="{
      'px-2.5': !collapsed,
    }"
    @mouseleave="onHandleMouse('leave')"
  >
    <aside class="flex h-full flex-col gap-y-3 py-2.5">
      <div
        v-if="$slots.header"
        class="rounded-lg"
        :class="{
          'bg-transparent': layoutStore.leftAsideCollapsed,
          'bg-white': !layoutStore.leftAsideCollapsed,
        }"
      >
        <slot name="header" />
      </div>
      <div class="flex-1">
        <slot />
      </div>
      <div
        v-if="$slots.footer"
        class="rounded-lg px-2.5 py-4"
        :class="{
          'bg-transparent': layoutStore.leftAsideCollapsed,
          'bg-white': !layoutStore.leftAsideCollapsed,
        }"
      >
        <slot name="footer" />
      </div>
    </aside>
    <div
      v-if="side === 'left'"
      class="absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize"
      style="background: transparent"
      @mouseenter="onHandleMouse('enter')"
    />
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from "@/store/layout"
import { debounce } from "lodash-es"

const layoutStore = useLayoutStore()

withDefaults(
  defineProps<{
    side: "left" | "right"
    collapsed: boolean
    collapsedWidth?: number
    width?: number
  }>(),
  {
    collapsedWidth: 66,
    width: 220,
  },
)

const onHandleMouse = debounce((type: "enter" | "leave") => {
  if (layoutStore.leftAsidePinned) return
  const shouldCollapse = type !== "enter"
  if (layoutStore.leftAsideCollapsed !== shouldCollapse) {
    layoutStore.onUpdateLeftAsideCollapsed(shouldCollapse)
  }
}, 100)
</script>
