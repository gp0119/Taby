<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex items-center gap-x-2">
      <n-icon-wrapper>
        <n-icon size="18" :component="LanguageOutline" />
      </n-icon-wrapper>
      <span>Language</span>
    </div>
    <div class="flex items-center gap-x-2">
      <n-button
        :tertiary="languageStore.language === 'en-US'"
        :quaternary="languageStore.language === 'zh-CN'"
        size="small"
        @click="changeLanguage('en-US')"
      >
        <span>En</span>
      </n-button>
      <n-button
        :tertiary="languageStore.language === 'zh-CN'"
        :quaternary="languageStore.language === 'en-US'"
        size="small"
        @click="changeLanguage('zh-CN')"
      >
        <span>中</span>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { LanguageOutline } from "@vicons/ionicons5"
import { useLanguageStore } from "@/store/language"

const languageStore = useLanguageStore()

const changeLanguage = async (value: string) => {
  languageStore.setLanguage(value)
}
</script>
