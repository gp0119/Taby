<template>
  <n-popover
    v-bind="$attrs"
    :keep-alive-on-hover="false"
    :trigger="trigger"
    :placement="placement"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="text-xs">{{ message }}</div>
  </n-popover>
</template>

<script setup lang="ts">
import { PopoverProps } from "naive-ui"

withDefaults(
  defineProps<{
    trigger?: PopoverProps["trigger"]
    placement?: PopoverProps["placement"]
    message: string
  }>(),
  {
    trigger: "hover",
    placement: "bottom",
  },
)
</script>
