import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import type { iSetting } from "@/type"
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
  })

  const setSetting = <K extends keyof iSetting>(key: K, value: iSetting[K]) => {
    setting.value[key] = value
  }

  const getSetting = <K extends keyof iSetting>(key: K) => {
    return setting.value[key]
  }

  watchEffect(() => {
    syncManager.setInterval(setting.value.saveAfterOperationTime)
  })

  watchEffect(() => {
    if (setting.value.hideRightClickMenu) {
      chrome.runtime.sendMessage({ type: "hide-right-click-menu" })
    } else {
      chrome.runtime.sendMessage({ type: "updateContextMenus" })
    }
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
