<template>
  <n-dropdown
    trigger="hover"
    :options="options"
    @select="changeLanguage"
    :render-label="renderLabel"
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

const currentLanguage = useLocalStorage("LANG", "zh-CN")
const { locale } = useI18n()

const changeLanguage = async (value: string) => {
  console.log("value: ", value)
  currentLanguage.value = value
}

watchEffect(() => {
  locale.value = currentLanguage.value
})

const renderLabel = (option: SelectOption | SelectGroupOption) => {
  console.log("currentLanguage: ", currentLanguage)
  return (
    <div class={{ "text-primary": currentLanguage.value === option.key }}>
      {option.label}
    </div>
  )
}
</script>
