<template>
  <div class="rounded shadow-base">
    <div @click="isOpen = !isOpen" class="flex items-center px-4 py-3">
      <n-icon
        size="20"
        class="mr-2 cursor-pointer transition-transform duration-300"
        :class="{ 'rotate-90': isOpen }"
      >
        <ChevronForward />
      </n-icon>
      <span class="cursor-pointer text-gray-900">
        {{ ft("window") }} {{ index + 1 }}
      </span>
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <div class="bg-body-color px-4 pb-4" v-if="!isEmpty(tabs)">
          <slot name="cards" :tabs="tabs"></slot>
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
import { ref } from "vue"
import { ChevronForward } from "@vicons/ionicons5"
import type { Card as iCard } from "@/type.ts"
import { useHelpi18n } from "@/hooks/useHelpi18n"
defineProps<{
  index: number
  tabs: iCard[]
}>()

const { ft } = useHelpi18n()

const isEmpty = (tabs: any[]) => {
  return tabs.filter((tab) => !isNewTabPage(tab.url)).length <= 0
}

const isOpen = ref(true)
</script>
