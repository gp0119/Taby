<template>
  <n-tooltip
    v-bind="$attrs"
    :keep-alive-on-hover="false"
    :trigger="trigger"
    :show-arrow="false"
    :placement="placement"
    :disabled="disabled"
    style="background-color: rgba(0, 0, 0, 0.8)"
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
    disabled?: boolean
  }>(),
  {
    trigger: "hover",
    placement: "bottom",
    disabled: false,
  },
)
</script>
