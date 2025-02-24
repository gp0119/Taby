<template>
  <n-popover trigger="hover" content-class="!p-0">
    <template #trigger>
      <n-tag
        class="flex-center h-[20px] flex-1 cursor-pointer select-none"
        size="small"
        :color="{
          color: `${selectedColor}33`,
          textColor: selectedColor,
          borderColor: `${selectedColor}4A`,
        }"
        >Change Color</n-tag
      >
    </template>
    <n-scrollbar class="max-h-[100px] w-[160px]">
      <n-space wrap size="small" align="center">
        <div
          v-for="color in COLOR_LIST"
          :key="color"
          class="flex-center h-[20px] w-[20px] cursor-pointer select-none overflow-hidden"
          @click="pickColor(color)"
          :style="`background-color: ${color}33; color: ${color};border-color: ${color}4A; border-width: 1px; border-style: solid;`"
        >
          <n-icon
            v-if="color === selectedColor"
            size="12"
            :component="Checkmark"
          />
        </div>
      </n-space>
    </n-scrollbar>
  </n-popover>
</template>

<script setup lang="ts">
import { COLOR_LIST } from "@/utils/constants.ts"
import { Checkmark } from "@vicons/carbon"

const selectedColor = defineModel("value", {
  type: String,
  default: COLOR_LIST[0],
})

const pickColor = (color: string) => {
  selectedColor.value = color
}
</script>
