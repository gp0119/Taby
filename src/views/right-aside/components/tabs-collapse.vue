<template>
  <div class="group/title flex items-center justify-between px-2.5 py-2 pb-4">
    <WindowIcon>{{ index + 1 }}</WindowIcon>
    <PopoverIcon
      :message="ft('close-all-tabs')"
      size="20"
      icon-class="hidden cursor-pointer text-primary group-hover/title:block"
      :icon="Close"
      @click="onCloseAllTabs"
    />
  </div>

  <div
    v-if="!isEmpty(tabs)"
    class="h-[calc(100vh-60px)] overflow-y-auto px-3"
    :style="{
      scrollbarWidth: 'none',
    }"
  >
    <slot name="cards" :tabs="tabs" />
  </div>
  <div v-else class="py-3 text-center font-thin text-text-secondary">
    {{ ft("no-tabs") }}
  </div>
</template>

<script setup lang="ts">
import { isNewTabPage } from "@/utils"
import { Close } from "@vicons/carbon"
import type { Card as iCard } from "@/type.ts"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import PopoverIcon from "@/components/popover-icon.vue"
import WindowIcon from "@/views/right-aside/components/window.vue"

defineProps<{
  index: number
  tabs: iCard[]
}>()

const { ft } = useHelpi18n()

const isEmpty = (tabs: any[]) => {
  return tabs.filter((tab) => !isNewTabPage(tab.url)).length <= 0
}

const emit = defineEmits<{
  (e: "closeAllTabs"): void
}>()
const onCloseAllTabs = () => {
  emit("closeAllTabs")
}
</script>
