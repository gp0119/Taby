<template>
  <component
    :is="tag"
    :href="href"
    class="flex w-full cursor-pointer items-center justify-between px-4 py-2"
    :class="{ 'hover:bg-hover-color': hover }"
    @click="onClick"
  >
    <div class="flex select-none items-center gap-x-2">
      <n-button tertiary size="small" class="w-[28px]">
        <template #icon>
          <n-icon size="18" :component="icon" />
        </template>
      </n-button>
      <span>{{ title }}</span>
    </div>
    <slot>
      <n-icon
        size="20"
        class="text-text-secondary"
        :component="ChevronForward"
      />
    </slot>
  </component>
</template>

<script setup lang="ts">
import type { Component } from "vue"
import { ChevronForward } from "@vicons/ionicons5"

withDefaults(
  defineProps<{
    tag?: "a" | "div"
    href?: string
    icon: Component
    title: string
    hover?: boolean
  }>(),
  {
    tag: "div",
    hover: true,
  },
)

const emit = defineEmits<{
  (e: "click"): void
}>()

const onClick = () => {
  emit("click")
}
</script>
