<template>
  <n-popover
    v-model:show="show"
    trigger="hover"
    content-class="scrollbar-thin scrollbar-gutter-stable max-h-[120px] grid grid-cols-4 gap-2 overflow-scroll"
  >
    <template #trigger>
      <n-button
        :size="size"
        :color="`${selectedColor}33`"
        :text-color="selectedColor"
        :style="`border-color: ${selectedColor}4A; border-width: 1px; border-style: solid;`"
      >
        <template #icon>
          <n-icon size="16" :component="ColorPalette" />
        </template>
      </n-button>
    </template>
    <div
      v-for="color in COLOR_LIST"
      :key="color"
      class="flex-center h-[20px] w-[20px] cursor-pointer select-none overflow-hidden"
      :style="`background-color: ${color}33; color: ${color};border-color: ${color}4A; border-width: 1px; border-style: solid;`"
      @click="pickColor(color)"
    >
      <n-icon v-if="color === selectedColor" size="12" :component="Checkmark" />
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { COLOR_LIST } from "@/utils/constants.ts"
import { Checkmark, ColorPalette } from "@vicons/carbon"

defineProps({
  size: {
    type: String,
    default: "medium",
  },
})

const show = ref(false)
const selectedColor = defineModel("value", {
  type: String,
  default: COLOR_LIST[0],
})

const pickColor = (color: string) => {
  selectedColor.value = color
  show.value = false
}
</script>
