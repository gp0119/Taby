<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex items-center gap-x-1">
      <n-icon-wrapper>
        <n-icon size="18" :component="PaintBrush" />
      </n-icon-wrapper>
      <span>Theme</span>
    </div>
    <div class="flex items-center gap-x-1">
      <div
        v-for="option in themeOptions"
        :key="option.value"
        class="flex-center cursor-pointer rounded-md border-2"
        :class="{
          'border-primary': currentTheme === option.value,
          'border-transparent': currentTheme !== option.value,
        }"
        @click="setTheme(option.value)"
      >
        <div
          class="h-[20px] w-[20px] rounded-md border border-white"
          :style="{ background: option.color }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { PaintBrush } from "@vicons/carbon"
import { useThemeStore } from "@/store/theme.ts"

const { themeColor, theme, setTheme } = useThemeStore()

const currentTheme = ref(theme)

const themeOptions = Object.keys(themeColor).map((key) => ({
  label: key,
  value: key,
  color: themeColor[key].primary,
}))
</script>
