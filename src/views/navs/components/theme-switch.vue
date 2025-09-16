<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex select-none items-center gap-x-2">
      <n-button tertiary size="small" class="w-[28px]">
        <template #icon>
          <n-icon size="18" :component="ColorPalette" />
        </template>
      </n-button>
      <span>{{ ft("theme") }}</span>
    </div>
    <div class="flex items-center gap-x-2">
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
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useTheme } from "@/hooks/useTheme"

const { setTheme, theme } = useTheme()
const { ft } = useHelpi18n()
</script>
