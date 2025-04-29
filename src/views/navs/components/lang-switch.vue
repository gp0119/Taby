<template>
  <n-dropdown
    trigger="hover"
    :options="options"
    :render-label="renderLabel"
    @select="changeLanguage"
  >
    <n-button quaternary circle>
      <template #icon>
        <n-icon :size="20" class="text-primary" :component="LanguageOutline" />
      </template>
    </n-button>
  </n-dropdown>
</template>

<script setup lang="tsx">
import { LanguageOutline } from "@vicons/ionicons5"
import { useLocalStorage } from "@vueuse/core"
import { useI18n } from "vue-i18n"

const options = [
  { label: "English", key: "en-US" },
  { label: "简体中文", key: "zh-CN" },
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
