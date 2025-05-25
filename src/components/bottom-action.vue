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
        ref="bottomActionRef"
        class="pointer-events-auto fixed bottom-3 left-1/2 z-10 -translate-x-1/2 cursor-move rounded-xl bg-card-color shadow-card-shadow"
        :style="{ left: clientX }"
        @mousedown="onMouseDown"
      >
        <div class="flex items-center justify-between gap-x-8 px-6 py-4">
          <slot name="default" />
          <n-button
            secondary
            circle
            size="small"
            type="error"
            @click="closeDrawer"
          >
            <template #icon>
              <n-icon :size="20" :component="Close" />
            </template>
          </n-button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { Close } from "@vicons/carbon"
import { throttle } from "lodash-es"

const show = defineModel<boolean>("show", {
  default: false,
})

const emit = defineEmits<{
  (e: "close"): void
}>()

const bottomActionRef = ref<HTMLElement>()

const closeDrawer = () => {
  show.value = false
  emit("close")
}

const clientX = ref("50%")
const onMouseDown = (e: MouseEvent) => {
  const startX = e.clientX
  const startLeft =
    clientX.value === "50%" ? window.innerWidth / 2 : parseInt(clientX.value)
  const onMouseMove = throttle((e: MouseEvent) => {
    const deltaX = e.clientX - startX
    let newLeft = startLeft + deltaX
    const halfWidth = (bottomActionRef.value?.offsetWidth ?? 0) / 2
    const minX = halfWidth
    const maxX = window.innerWidth - halfWidth

    if (newLeft < minX) newLeft = minX
    if (newLeft > maxX) newLeft = maxX

    clientX.value = `${newLeft}px`
  }, 16)
  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
  }
  document.addEventListener("mousemove", onMouseMove)
  document.addEventListener("mouseup", onMouseUp)
}
</script>
