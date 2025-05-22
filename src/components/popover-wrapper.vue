<template>
  <n-tooltip
    v-bind="$attrs"
    :keep-alive-on-hover="false"
    :trigger="trigger"
    :show-arrow="false"
    :placement="placement"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="text-xs">{{ message }}</div>
  </n-tooltip>
</template>

<script setup lang="ts">
import { TooltipProps } from "naive-ui"

withDefaults(
  defineProps<{
    trigger?: TooltipProps["trigger"]
    placement?: TooltipProps["placement"]
    message: string
  }>(),
  {
    trigger: "hover",
    placement: "bottom",
  },
)
</script>
