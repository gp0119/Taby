import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import type { iSetting } from "@/type"
import syncManager from "@/sync/syncManager"

export const useSettingStore = defineStore("Setting", () => {
  const setting = useLocalStorage<iSetting>("setting", {
    language: "en-US",
    theme: "light",
    layoutMode: "collapse",
    openInNewWindow: true,
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

  return {
    setting,
    setSetting,
    getSetting,
  }
})
