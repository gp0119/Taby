<template>
  <n-select v-model:value="id" :multiple="multiple" :options="options">
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
}>()

const id = defineModel<number | null | number[]>("modelValue", {
  default: null,
})
</script>
