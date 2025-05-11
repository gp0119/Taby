<template>
  <div>
    <h1
      class="h-[50px] select-none border-0 border-b border-solid px-4 text-right font-medium leading-[50px] text-text-primary"
    >
      {{ ft("open-tabs") }}
    </h1>
    <div
      class="right-aside-area scrollbar-thin h-[calc(100vh-50px)] overflow-y-auto px-3 py-4"
    >
      <TabsCollapse
        v-for="(item, windowId, index) in tabs"
        :key="index"
        class="mb-4"
        :index="index"
        :tabs="item"
        @close-all-tabs="onCloseAllTabs(windowId)"
      >
        <template #cards="{ tabs: _tabs }">
          <TabsWrapper
            v-if="isExpanded"
            :tabs="_tabs"
            :window-id="windowId"
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
        </template>
      </TabsCollapse>
    </div>
    <BatchTabAction />
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
import type { Card as iCard } from "@/type"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchCardStore } from "@/store/batch-card"
import BatchTabAction from "./components/batch-tab-action.vue"
import { useDraggableStore } from "@/store/draggable"
import { useDuplicateCardStore } from "@/store/duplicate-card"

const draggableStore = useDraggableStore()
const duplicateCardStore = useDuplicateCardStore()
const {
  tabs,
  getTabs,
  removeTab,
  activeTab,
  moveTab,
  closeAllTabsExceptCurrent,
} = useChromeTabs()
const isExpanded = ref(true)
const { refreshCollections } = useRefresh()
const { ft } = useHelpi18n()
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

const onCloseAllTabs = async (windowId: number | string) => {
  await closeAllTabsExceptCurrent(Number(windowId))
  await refreshTabs()
}

const onHandleCheckbox = (e: boolean, tab: iCard) => {
  if (e) {
    batchTabsStore.addSelectedTab(tab)
  } else {
    batchTabsStore.removeSelectedTab(tab.id)
  }
}
</script>
