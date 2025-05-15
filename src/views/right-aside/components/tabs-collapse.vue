<template>
  <div class="overflow-hidden rounded-md shadow-base">
    <div class="group/title flex items-center justify-between px-4 py-3">
      <div class="flex items-center" @click="isOpen = !isOpen">
        <n-icon
          size="18"
          class="mr-1 cursor-pointer transition-transform duration-300"
          :class="{ 'rotate-90': isOpen }"
        >
          <ChevronForward />
        </n-icon>
        <span class="cursor-pointer select-none text-gray-900">
          {{ ft("window") }} {{ index + 1 }}
        </span>
      </div>
      <PopoverIcon
        message="Close All Tabs"
        size="20"
        icon-class="hidden cursor-pointer text-primary group-hover/title:block"
        :icon="Close"
        @click="onCloseAllTabs"
      />
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="-mt-3 overflow-hidden">
        <div v-if="!isEmpty(tabs)" class="bg-body-color px-4 py-4">
          <slot name="cards" :tabs="tabs" />
        </div>
        <template v-else>
          <div class="py-3 text-center font-thin text-text-secondary">
            {{ ft("no-tabs") }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isNewTabPage } from "@/utils"
import { ChevronForward } from "@vicons/ionicons5"
import { Close } from "@vicons/carbon"
import type { Card as iCard } from "@/type.ts"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import PopoverIcon from "@/components/popover-icon.vue"

defineProps<{
  index: number
  tabs: iCard[]
}>()

const { ft } = useHelpi18n()

const isEmpty = (tabs: any[]) => {
  return tabs.filter((tab) => !isNewTabPage(tab.url)).length <= 0
}

const isOpen = ref(true)

const emit = defineEmits<{
  (e: "closeAllTabs"): void
}>()
const onCloseAllTabs = () => {
  emit("closeAllTabs")
}
</script>
