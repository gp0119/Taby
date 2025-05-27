<template>
  <n-tooltip
    v-bind="$attrs"
    :keep-alive-on-hover="false"
    :trigger="trigger"
    :show-arrow="false"
    :placement="placement"
    :disabled="disabled"
    content-class="!p-0"
  >
    <template #trigger>
      <slot />
    </template>
    <slot name="message">
      <div class="text-xs">{{ message }}</div>
    </slot>
  </n-tooltip>
</template>

<script setup lang="ts">
import { TooltipProps } from "naive-ui"

withDefaults(
  defineProps<{
    trigger?: TooltipProps["trigger"]
    placement?: TooltipProps["placement"]
    message?: string
    disabled?: boolean
  }>(),
  {
    trigger: "hover",
    placement: "bottom",
    disabled: false,
  },
)
</script>
