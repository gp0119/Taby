export const useRefresh = () => {
  const updateContextMenus = async () => {
    await chrome.runtime.sendMessage({
      type: "updateContextMenus",
    })
  }

  return {
    updateContextMenus,
  }
}
