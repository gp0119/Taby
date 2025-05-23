<template>
  <div
    class="right-aside-area h-full rounded-lg"
    :class="{
      'bg-white': !layoutStore.rightAsideCollapsed,
      'bg-transparent': layoutStore.rightAsideCollapsed,
    }"
  >
    <WindowIconWrapper
      :tabs="tabs"
      :active="activeWindowId"
      @update:active="updateActiveWindowId"
    />
    <div class="scrollbar-none h-[calc(100vh-60px)] overflow-y-auto px-3">
      <TabsWrapper
        v-if="tabs[activeWindowId] && tabs[activeWindowId].length > 0"
        :tabs="tabs[activeWindowId]"
        :window-id="activeWindowId"
        :selected-tab-ids="batchTabsStore.selectedTabIds"
        :show-checkbox="
          batchCollectionStore.selectedCollectionIds.length <= 0 &&
          batchCardStore.selectedCardIds.length <= 0 &&
          !duplicateCardStore.isFindDuplicate &&
          !draggableStore.draggable
        "
        @remove-tab="removeTab"
        @active-tab="activeTab"
        @drag-end="onDragEnd"
        @check="onHandleCheckbox"
      />
      <div v-else class="py-3 text-center font-thin text-text-secondary">
        {{ ft("no-tabs") }}
      </div>
    </div>
  </div>
  <BatchTabAction />
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { debounce } from "lodash-es"
import TabsWrapper from "./components/tabs-wrapper.vue"
import type { SortableEvent } from "vue-draggable-plus"
import type { Card as iCard } from "@/type"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchCardStore } from "@/store/batch-card"
import BatchTabAction from "./components/batch-tab-action.vue"
import { useDraggableStore } from "@/store/draggable"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useLayoutStore } from "@/store/layout"
import WindowIconWrapper from "./components/window-icon-wrapper.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"

const { ft } = useHelpi18n()
const layoutStore = useLayoutStore()
const draggableStore = useDraggableStore()
const duplicateCardStore = useDuplicateCardStore()
const {
  tabs,
  getTabs,
  removeTab,
  activeTab,
  moveTab,
  activeWindowId,
  updateActiveWindowId,
} = useChromeTabs()
const { refreshCollections } = useRefresh()
const batchTabsStore = useBatchTabsStore()
const batchCollectionStore = useBatchCollectionStore()
const batchCardStore = useBatchCardStore()

async function refreshTabs() {
  await getTabs()
}

const debounceRefreshTabs = debounce(refreshTabs, 300, {
  leading: false,
  trailing: true,
})

chrome.tabs.onUpdated.addListener(debounceRefreshTabs)
chrome.tabs.onMoved.addListener(debounceRefreshTabs)
chrome.tabs.onRemoved.addListener(debounceRefreshTabs)
chrome.tabs.onAttached.addListener(debounceRefreshTabs)

const onDragEnd = async (evt: SortableEvent) => {
  const { item: itemEl, to, newIndex } = evt
  const { id, windowid } = itemEl.dataset
  if (to.classList.contains("card-wrapper")) {
    const toClollectionId = to.getAttribute("data-collectionid")
    const title = itemEl.getAttribute("data-title") as string
    const url = itemEl.getAttribute("data-url") as string
    const favicon = itemEl.getAttribute("data-favicon") as string
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
  } else if (to.classList.contains("aside-card-wrapper")) {
    const toWindowId = to.getAttribute("data-windowid")
    await moveTab(Number(id), Number(newIndex), Number(toWindowId))
    await refreshTabs()
  } else {
    await moveTab(Number(id), Number(newIndex), Number(windowid))
    await refreshTabs()
  }
}

onMounted(async () => {
  await debounceRefreshTabs()
  window.addEventListener("beforeunload", removeListener)
})

const removeListener = () => {
  chrome.tabs.onUpdated.removeListener(debounceRefreshTabs)
  chrome.tabs.onMoved.removeListener(debounceRefreshTabs)
  chrome.tabs.onRemoved.removeListener(debounceRefreshTabs)
  chrome.tabs.onAttached.removeListener(debounceRefreshTabs)
  window.removeEventListener("beforeunload", removeListener)
}

const onHandleCheckbox = (e: boolean, tab: iCard) => {
  if (e) {
    batchTabsStore.addSelectedTab(tab)
  } else {
    batchTabsStore.removeSelectedTab(tab.id)
  }
}
</script>
