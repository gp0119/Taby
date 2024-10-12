import { isNewTabPage } from "@/utils";
import { iCard } from "@/type.ts";

export function useChromeTabs() {
  const tabs = ref<iCard[][]>([]);

  async function getTabs() {
    const res = await chrome.tabs.query({});
    console.log("res: ", res);
    tabs.value = res
      .filter((item) => !isNewTabPage(item.url as string))
      .reduce((acc: iCard[][], cur) => {
        const last = acc[acc.length - 1];
        if (last && last[0].windowId === cur.windowId) {
          last.push({
            title: cur.title || "",
            url: cur.url || "",
            windowId: cur.windowId,
            id: cur.id,
            oldIndex: cur.index,
          });
        } else {
          acc.push([
            {
              title: cur.title || "",
              url: cur.url || "",
              windowId: cur.windowId,
              id: cur.id,
              oldIndex: cur.index,
            },
          ]);
        }
        return acc;
      }, []);
  }

  function createTab(url: string) {
    return chrome.tabs.create({ url });
  }

  function removeTab(tabId: number | undefined) {
    if (!tabId) return;
    tabs.value = tabs.value.map((item) => item.filter((i) => i.id !== tabId));
    return chrome.tabs.remove(tabId);
  }

  async function moveTab(
    tabId: number | undefined,
    index: number,
    windowId: number,
  ) {
    if (!tabId) return;
    await chrome.tabs.move(tabId, { index, windowId });
    await getTabs();
  }

  function activeTab(tabId: number | undefined) {
    if (!tabId) return;
    return chrome.tabs.update(tabId, { active: true });
  }

  return {
    tabs,
    getTabs,
    createTab,
    removeTab,
    moveTab,
    activeTab,
  };
}
