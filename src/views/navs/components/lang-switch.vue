<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex items-center gap-x-1">
      <n-icon-wrapper>
        <n-icon size="18" :component="LanguageOutline" />
      </n-icon-wrapper>
      <span>Language</span>
    </div>
    <div class="flex items-center gap-x-2">
      <div
        v-for="option in options"
        :key="option.key"
        class="flex-center h-[30px] w-[30px] rounded-md border-2 bg-white"
        :class="{
          'border-primary': currentLanguage === option.key,
          'border-transparent': currentLanguage !== option.key,
        }"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { LanguageOutline } from "@vicons/ionicons5"
import { useLocalStorage } from "@vueuse/core"
import { useI18n } from "vue-i18n"

const options = [
  { label: "En", key: "en-US" },
  { label: "中", key: "zh-CN" },
]

const currentLanguage = useLocalStorage("LANG", "en-US")
const { locale } = useI18n()

const changeLanguage = async (value: string) => {
  currentLanguage.value = value
}

watchEffect(() => {
  locale.value = currentLanguage.value
})

const renderLabel = (option: any) => {
  return (
    <div class={{ "text-primary": currentLanguage.value === option.key }}>
      {option.label}
    </div>
  )
}
</script>
