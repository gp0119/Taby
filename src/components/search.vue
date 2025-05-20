<template>
  <div
    class="h-[30px] w-full cursor-pointer select-none whitespace-nowrap rounded border border-border-color bg-card-color px-2 text-xs font-thin leading-[30px] text-text-secondary"
    @click="openModal"
  >
    {{ ft("placeholder-search") }}
  </div>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useSearchModal } from "@/hooks/useSearchModal"
import { useEventListener } from "@vueuse/core"

const { ft } = useHelpi18n()
const { openModal } = useSearchModal()

const cleanup = useEventListener(window, "keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault()
    e.stopPropagation()
    openModal()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>
