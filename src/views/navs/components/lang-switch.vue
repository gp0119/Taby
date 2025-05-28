<template>
  <div class="flex w-full items-center justify-between">
    <div class="flex select-none items-center gap-x-2">
      <n-button tertiary size="small" class="w-[28px]">
        <template #icon>
          <n-icon size="18" :component="LanguageOutline" />
        </template>
      </n-button>
      <span>{{ ft("language") }}</span>
    </div>
    <div class="flex items-center gap-x-2">
      <n-button
        :tertiary="language === 'en-US'"
        :quaternary="language === 'zh-CN'"
        size="small"
        class="w-[28px] px-0"
        @click="changeLanguage('en-US')"
      >
        <span class="text-xs">En</span>
      </n-button>
      <n-button
        :tertiary="language === 'zh-CN'"
        :quaternary="language === 'en-US'"
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
import { useSettingStore } from "@/store/setting"
import { useHelpi18n } from "@/hooks/useHelpi18n.js"

const settingStore = useSettingStore()
const { ft } = useHelpi18n()
const language = computed(() => settingStore.getSetting("language"))
const changeLanguage = async (value: "zh-CN" | "en-US") => {
  settingStore.setSetting("language", value)
}
</script>
