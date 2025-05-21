<template>
  <PopoverWrapper :message="ft('placeholder-search')" placement="bottom-end">
    <n-button
      quaternary
      :focusable="false"
      size="small"
      class="w-[28px]"
      @click="openModal"
    >
      <template #icon>
        <n-icon size="18" :component="Search" />
      </template>
    </n-button>
  </PopoverWrapper>
</template>

<script setup lang="tsx">
import { Search } from "@vicons/ionicons5"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useEventListener } from "@vueuse/core"
import { useSearchModal } from "@/hooks/useSearchModal"

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
