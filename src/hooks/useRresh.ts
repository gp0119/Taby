export const useRefresh = () => {
  const updateContextMenus = async () => {
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
