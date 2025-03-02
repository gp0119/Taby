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
      <span class="cursor-pointer text-gray-900">Window {{ index + 1 }}</span>
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <div class="bg-body-color px-4 pb-4">
          <slot name="cards" :tabs="tabs"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ChevronForward } from "@vicons/ionicons5"
import type { Card as iCard } from "@/type.ts"

defineProps<{
  index: number
  tabs: iCard[]
}>()

const isOpen = ref(true)
</script>
