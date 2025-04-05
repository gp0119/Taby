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
        class="pointer-events-auto fixed bottom-3 left-1/2 z-10 w-[600px] -translate-x-1/2 cursor-move rounded-xl bg-card-color shadow-base-lg"
        @mousedown="onMouseDown"
        :style="{ left: clientX }"
      >
        <n-icon
          class="absolute right-4 top-4 cursor-pointer text-gray-400"
          :size="20"
          :component="Close"
          @click="closeDrawer"
        />
        <div class="p-4">
          <slot name="default" />
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
    const halfWidth = 300
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
