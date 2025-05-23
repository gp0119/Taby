<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex items-center gap-x-2">
      <n-icon-wrapper>
        <n-icon size="18" :component="LanguageOutline" />
      </n-icon-wrapper>
      <span>Language</span>
    </div>
    <div class="flex items-center gap-x-2">
      <div
        v-for="option in options"
        :key="option.key"
        class="flex-center h-[26px] w-[26px] cursor-pointer rounded-md border-2 bg-white text-xs font-medium"
        :class="{
          'border-primary': languageStore.language === option.key,
          'border-transparent': languageStore.language !== option.key,
        }"
        @click="changeLanguage(option.key)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { LanguageOutline } from "@vicons/ionicons5"
import { useLanguageStore } from "@/store/language"

const options = [
  { label: "En", key: "en-US" },
  { label: "中", key: "zh-CN" },
]

const languageStore = useLanguageStore()

const changeLanguage = async (value: string) => {
  languageStore.setLanguage(value)
}
</script>
