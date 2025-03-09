<template>
  <div>
    <div
      class="h-[50px] select-none border-0 border-b border-solid px-3 text-right leading-[50px] text-text-primary"
    >
      {{ ft("open-tabs") }}
    </div>
    <div class="right-aside-area px-3 py-4">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { debounce } from "lodash-es"
import TabsWrapper from "./components/tabs-wrapper.vue"
import TabsCollapse from "./components/tabs-collapse.vue"
import type { SortableEvent } from "vue-draggable-plus"
import { useHelpi18n } from "@/hooks/useHelpi18n"

const { tabs, getTabs, removeTab, activeTab, moveTab } = useChromeTabs()
const isExpanded = ref(true)
const { refreshCollections } = useRefresh()
const { ft } = useHelpi18n()
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
        let faviconId = null
        if (favicon) {
          faviconId = await dataManager.addFavicon(favicon)
        }
        await dataManager.addCard(
          {
            title,
            url,
            collectionId: Number(toClollectionId),
            ...(faviconId && { faviconId }),
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
