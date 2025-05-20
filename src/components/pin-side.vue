<template>
  <div
    class="relative h-full translate-x-0 px-2"
    :style="{
      width:
        side === 'left'
          ? layoutStore.leftAsideWidth + 'px'
          : layoutStore.rightAsideWidth + 'px',
      transition: 'all 0.2s ease-in-out',
    }"
    @mouseleave="handleMouseLeave"
  >
    <aside
      class="pin-side-aside flex h-full flex-col gap-y-2 py-2"
      @mouseenter="handleMouseEnter"
    >
      <div
        v-if="$slots.header"
        class="rounded-lg"
        :class="[
          !layoutStore.leftAsideCollapsed ? 'bg-white' : 'bg-transparent',
          'transition-colors duration-300 ease-in-out',
        ]"
      >
        <slot name="header" />
      </div>
      <div
        class="flex-1 rounded-lg"
        :class="[
          !layoutStore.leftAsideCollapsed ? 'bg-white' : 'bg-transparent',
          'transition-colors duration-300 ease-in-out',
        ]"
      >
        <slot />
      </div>
      <div
        v-if="$slots.footer"
        class="rounded-lg px-2.5 py-4"
        :class="[
          !layoutStore.leftAsideCollapsed ? 'bg-white' : 'bg-transparent',
          'transition-colors duration-300 ease-in-out',
        ]"
      >
        <slot name="footer" />
      </div>
    </aside>
    <div
      v-if="side === 'left'"
      class="absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize"
      style="background: transparent"
      @mouseenter="handleMouseEnter"
    />
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from "@/store/layout"
import { onUnmounted } from "vue"

const layoutStore = useLayoutStore()

const props = withDefaults(
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

let mouseMoveHandler: ((e: MouseEvent) => void) | null = null
const safeDistance = 40 // px

function handleMouseLeave() {
  if (layoutStore.leftAsidePinned) return
  if (!layoutStore.leftAsideCollapsed) {
    mouseMoveHandler = (e: MouseEvent) => {
      const aside = document.querySelector(".pin-side-aside") as HTMLElement
      if (!aside) return
      const rect = aside.getBoundingClientRect()
      if (e.clientX - rect.right > safeDistance) {
        if (props.side === "left") {
          layoutStore.onUpdateLeftAsideCollapsed(true)
        } else {
          layoutStore.onUpdateRightAsideCollapsed(true)
        }
        document.removeEventListener("mousemove", mouseMoveHandler!)
        mouseMoveHandler = null
      }
    }
    document.addEventListener("mousemove", mouseMoveHandler)
  }
}

function handleMouseEnter() {
  if (layoutStore.leftAsidePinned) return
  if (props.side === "left" && layoutStore.leftAsideCollapsed) {
    layoutStore.onUpdateLeftAsideCollapsed(false)
  } else if (props.side === "right" && layoutStore.rightAsideCollapsed) {
    layoutStore.onUpdateRightAsideCollapsed(false)
  }
  if (mouseMoveHandler) {
    document.removeEventListener("mousemove", mouseMoveHandler)
    mouseMoveHandler = null
  }
}

onUnmounted(() => {
  if (mouseMoveHandler) {
    document.removeEventListener("mousemove", mouseMoveHandler)
  }
})
</script>
