<template>
  <div>
    <div
      class="h-[50px] select-none border-0 border-b border-solid px-3 text-right leading-[50px] text-text-primary"
    >
      OPEN TABS
    </div>
    <div class="right-aside-area px-3 py-4">
      <template v-if="!Object.keys(tabs).length">
        <div class="mb-3 rounded shadow-base">
          <div class="flex items-center p-2.5">
            <span class="select-none text-text-primary">Window 1</span>
          </div>
          <div class="p-2.5 text-gray-300 text-text-primary">No Tabs</div>
        </div>
      </template>
      <template v-else>
        <TabsCollapse
          v-for="(item, windowId, index) in tabs"
          :key="index"
          :index="index"
          :tabs="item"
        >
          <template #cards="{ tabs }">
            <TabsWrapper
              v-if="isExpanded"
              :tabs="tabs"
              :window-id="windowId"
              @remove-tab="removeTab"
              @active-tab="activeTab"
              @drag-end="onDragEnd"
            />
          </template>
        </TabsCollapse>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import DataManager from "@/db"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { debounce } from "lodash-es"
import TabsWrapper from "./components/tabs-wrapper.vue"
import TabsCollapse from "./components/tabs-collapse.vue"
import type { SortableEvent } from "vue-draggable-plus"
const dataManager = new DataManager()
const { tabs, getTabs, removeTab, activeTab, moveTab } = useChromeTabs()
const isExpanded = ref(true)
const { refreshCollections } = useRefresh()

async function refreshTabs() {
  await getTabs()
}

const debounceRefreshTabs = debounce(refreshTabs, 100)

chrome.tabs.onUpdated.addListener(debounceRefreshTabs)
chrome.tabs.onMoved.addListener(debounceRefreshTabs)
chrome.tabs.onRemoved.addListener(debounceRefreshTabs)
chrome.tabs.onAttached.addListener(debounceRefreshTabs)

const onDragEnd = async (evt: SortableEvent) => {
  const { item: itemEl, to, newIndex } = evt
  const { id, windowid } = itemEl.dataset
  if (to.classList.contains("card-wrapper")) {
    const toClollectionId = to.getAttribute("data-collectionid")
    chrome.tabs.sendMessage(
      Number(id),
      { action: "getFavicons" },
      async function (favicon) {
        const title = itemEl.getAttribute("data-title") as string
        const url = itemEl.getAttribute("data-url") as string
        await dataManager.addCard(
          {
            title,
            url,
            collectionId: Number(toClollectionId),
            ...(favicon && { favicon }),
          },
          newIndex!,
        )
        await refreshCollections()
      },
    )
  } else {
    await moveTab(Number(id), Number(newIndex), Number(windowid))
    await refreshTabs()
  }
}

onMounted(async () => {
  await getTabs()
})
</script>
