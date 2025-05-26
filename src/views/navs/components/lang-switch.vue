<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex select-none items-center gap-x-2">
      <n-icon-wrapper>
        <n-icon size="18" :component="LanguageOutline" />
      </n-icon-wrapper>
      <span>{{ ft("language") }}</span>
    </div>
    <div class="flex items-center gap-x-2">
      <n-button
        :tertiary="languageStore.language === 'en-US'"
        :quaternary="languageStore.language === 'zh-CN'"
        size="small"
        class="w-[28px] px-0"
        @click="changeLanguage('en-US')"
      >
        <span class="text-xs">En</span>
      </n-button>
      <n-button
        :tertiary="languageStore.language === 'zh-CN'"
        :quaternary="languageStore.language === 'en-US'"
        size="small"
        class="w-[28px] px-0"
        @click="changeLanguage('zh-CN')"
      >
        <span class="text-xs">中</span>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { LanguageOutline } from "@vicons/ionicons5"
import { useLanguageStore } from "@/store/language"
import { useHelpi18n } from "@/hooks/useHelpi18n.js"

const languageStore = useLanguageStore()
const { ft } = useHelpi18n()
const changeLanguage = async (value: string) => {
  languageStore.setLanguage(value)
}
</script>
