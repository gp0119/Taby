<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex items-center gap-x-2">
      <n-icon-wrapper>
        <n-icon size="18" :component="ColorPalette" />
      </n-icon-wrapper>
      <span>Theme</span>
    </div>
    <div class="flex items-center gap-x-1">
      <n-button
        :tertiary="theme === 'light'"
        :quaternary="theme === 'dark'"
        size="small"
        class="w-[28px]"
        @click="setTheme('light')"
      >
        <template #icon>
          <n-icon size="18" :component="Light" />
        </template>
      </n-button>
      <n-button
        :tertiary="theme === 'dark'"
        :quaternary="theme === 'light'"
        size="small"
        class="w-[28px]"
        @click="setTheme('dark')"
      >
        <template #icon>
          <n-icon size="18" :component="Moon" />
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ColorPalette, Light, Moon } from "@vicons/carbon"
import { useThemeStore } from "@/store/theme.ts"

const { setTheme, theme } = useThemeStore()
</script>
