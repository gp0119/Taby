import { defineStore } from "pinia"
import type { CardView } from "@/type"

export const useBatchTabsStore = defineStore("batch-tabs", () => {
  const selectedTab = ref<CardView[]>([])

  const addSelectedTab = (tab: CardView) => {
    selectedTab.value.push(tab)
  }

  const removeSelectedTab = (id: number) => {
    selectedTab.value = selectedTab.value.filter((item) => item.id !== id)
  }

  const clearSelectedTabs = () => {
    selectedTab.value = []
  }

  const selectedTabIds = computed(() => {
    return selectedTab.value.map((item) => item.id)
  })

  return {
    selectedTab,
    addSelectedTab,
    removeSelectedTab,
    clearSelectedTabs,
    selectedTabIds,
  }
})
