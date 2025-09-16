import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import type { iSetting } from "@/type"
import { DEFAULT_SHORTCUT_SETTINGS } from "@/utils/constants"
import syncManager from "@/sync/syncManager"
import { useI18n } from "vue-i18n"

export const useSettingStore = defineStore("Setting", () => {
  const { locale } = useI18n()
  const setting = useLocalStorage<iSetting>("setting", {
    language: "en-US",
    theme: "light",
    openInNewWindow: true,
    openCardsInGroup: false,
    hideRightClickMenu: false,
    saveAfterOperationTime: 5,
    shortcutSettings: { ...DEFAULT_SHORTCUT_SETTINGS },
  })

  // 迁移：为旧版本用户补齐缺失的快捷键配置
  const defaultShortcutSettings: iSetting["shortcutSettings"] = {
    ...DEFAULT_SHORTCUT_SETTINGS,
  }
  if (!setting.value.shortcutSettings) {
    // 整个字段不存在，直接填默认
    ;(setting.value as iSetting).shortcutSettings = defaultShortcutSettings
  } else {
    // 字段存在但缺键，做一次性补齐（保留用户已有配置）
    ;(setting.value as iSetting).shortcutSettings = {
      ...defaultShortcutSettings,
      ...setting.value.shortcutSettings,
    }
  }

  const setSetting = <K extends keyof iSetting>(key: K, value: iSetting[K]) => {
    setting.value[key] = value
  }

  const getSetting = <K extends keyof iSetting>(key: K) => {
    return setting.value[key]
  }

  watchEffect(() => {
    syncManager.setInterval(setting.value.saveAfterOperationTime)
  })

  watchEffect(async () => {
    const hideRightClickMenu = setting.value.hideRightClickMenu
    await chrome.storage.local.set({ hideRightClickMenu })
  })

  watchEffect(() => {
    locale.value = setting.value.language
  })

  return {
    setting,
    setSetting,
    getSetting,
  }
})
