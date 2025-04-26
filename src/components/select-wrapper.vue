<template>
  <n-select
    v-bind="$attrs"
    v-model:value="id"
    :multiple="multiple"
    :options="options"
    :placeholder="placeholder"
  >
    <template #action>
      <slot name="action" />
    </template>
  </n-select>
</template>

<script setup lang="ts">
import { iOptions } from "@/type.ts"

defineProps<{
  options: iOptions
  multiple?: boolean
  placeholder?: string
}>()

const id = defineModel<string | null | string[]>("modelValue", {
  default: null,
})
</script>
