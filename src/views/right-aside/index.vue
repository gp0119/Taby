<template>
  <div class="right-aside-area group/right-aside h-full rounded-lg">
    <WindowIconWrapper
      :tabs="tabs"
      :active="activeWindowId"
      @update:active="updateActiveWindowId"
      @close-all-tabs="closeAllTabsExceptCurrent"
      @save-all-tabs="onSaveAllTabs"
      @save-all-tabs-and-close="onSaveAllTabsAndClose"
      @close-duplicate-tabs="onCloseDuplicateTabs"
    />
    <div class="scrollbar-none h-[calc(100vh-76px)] overflow-y-auto px-3">
      <TabsWrapper
        v-if="tabs[activeWindowId] && !isEmpty(tabs[activeWindowId])"
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
      <div
        v-else-if="
          tabs[activeWindowId] &&
          isEmpty(tabs[activeWindowId]) &&
          !layoutStore.isRightCollapsed
        "
        class="flex-nowrap whitespace-nowrap py-3 text-center font-thin text-text-secondary"
      >
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
import { isNewTabPage } from "@/utils"
import dayjs from "dayjs"
import { useSpacesStore } from "@/store/spaces"

const { ft } = useHelpi18n()
const layoutStore = useLayoutStore()
const draggableStore = useDraggableStore()
const duplicateCardStore = useDuplicateCardStore()
const {
  tabs,
  getTabs,
  removeTab,
  removeTabs,
  activeTab,
  moveTab,
  activeWindowId,
  updateActiveWindowId,
  closeAllTabsExceptCurrent,
} = useChromeTabs()
const { refreshCollections } = useRefresh()
const batchTabsStore = useBatchTabsStore()
const batchCollectionStore = useBatchCollectionStore()
const batchCardStore = useBatchCardStore()
const spaceStore = useSpacesStore()

async function refreshTabs() {
  await getTabs()
}

const isEmpty = (tabs: any[]) => {
  return tabs.filter((tab) => !isNewTabPage(tab.url)).length <= 0
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
  const { item: itemEl, to, newIndex, from } = evt
  const { id, windowid } = itemEl.dataset
  if (from === to) return
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
        description: "",
        ...(faviconId && { faviconId }),
      },
      newIndex!,
    )
    await refreshCollections()
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

const onSaveAllTabs = async (windowId: number | string) => {
  const filteredTabs = tabs.value[windowId].filter(
    (tab) => !isNewTabPage(tab.url),
  )
  if (filteredTabs.length <= 0) return
  const newCollectionId = await dataManager.addCollection({
    title: dayjs().format("MMM DD [at] HH:mm"),
    spaceId: spaceStore.activeId,
    labelIds: [],
  })
  const cardIds: number[] = []
  for (const tab of filteredTabs) {
    const faviconId = await dataManager.addFavicon(tab.favicon)
    const cardId = await dataManager.addCard({
      title: tab.title,
      url: tab.url,
      collectionId: newCollectionId!,
      faviconId: faviconId,
      description: "",
    })
    cardIds.push(cardId)
  }
  await dataManager.batchUpdateCards(
    cardIds,
    { collectionId: newCollectionId! },
    "END",
  )
  await refreshCollections()
}

const onSaveAllTabsAndClose = async (windowId: number | string) => {
  await onSaveAllTabs(windowId)
  await closeAllTabsExceptCurrent(Number(windowId))
}

const onCloseDuplicateTabs = async (windowId: number | string) => {
  const currentTabs = tabs.value[windowId]
  const urlMap = new Set<string>()
  const duplicateTabsIds: number[] = []
  for (const tab of currentTabs) {
    if (urlMap.has(tab.url)) {
      duplicateTabsIds.push(tab.id!)
    } else {
      urlMap.add(tab.url)
    }
  }
  await removeTabs(duplicateTabsIds)
  await refreshTabs()
}
</script>
