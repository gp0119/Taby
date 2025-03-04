<template>
  <n-select v-model:value="id" :options="options">
    <template #action>
      <slot name="action" />
    </template>
  </n-select>
</template>

<script setup lang="ts">
import { iOptions } from "@/type.ts"

defineProps<{
  options: iOptions
}>()

const id = defineModel<number | null>("modelValue", {
  default: null,
})
</script>
