import { defineStore } from "pinia"
import type { ChromeTabInfo } from "@/type"

export const useBatchTabsStore = defineStore("batch-tabs", () => {
  const selectedTab = ref<ChromeTabInfo[]>([])

  const addSelectedTab = (tab: ChromeTabInfo) => {
    selectedTab.value.push(tab)
  }

  const removeSelectedTab = (id: number) => {
    selectedTab.value = selectedTab.value.filter((item) => item.id !== id)
  }

  const clearSelectedTabs = () => {
    selectedTab.value = []
  }

  const selectedTabIds = computed(() => {
    return selectedTab.value.map((item) => item.id) as number[]
  })

  return {
    selectedTab,
    addSelectedTab,
    removeSelectedTab,
    clearSelectedTabs,
    selectedTabIds,
  }
})
