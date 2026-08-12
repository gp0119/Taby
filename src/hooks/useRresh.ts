import { hasExtensionRuntime } from "@/utils/platform"

export const useRefresh = () => {
  const updateContextMenus = async () => {
    if (!hasExtensionRuntime()) return

    try {
      await chrome.runtime.sendMessage({
        type: "updateContextMenus",
      })
    } catch (error) {
      console.warn("Could not update context menus:", error)
    }
  }

  return {
    updateContextMenus,
  }
}
