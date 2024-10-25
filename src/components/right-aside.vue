<template>
  <div>
    <div
      class="h-[50px] select-none border-0 border-b border-solid px-3 text-right leading-[50px]"
    >
      OPEN TABS
    </div>
    <div class="right-aside-area px-3 py-4">
      <div
        v-for="(item, windowId, index) in tabs"
        :key="index"
        class="mb-3 rounded shadow-base"
      >
        <div class="flex items-center p-2.5">
          <span class="select-none">Window {{ index + 1 }}</span>
          <n-icon
            size="20"
            class="ml-2 inline-block cursor-pointer text-red-600"
            @click="toggleExpand(0, index)"
          >
            <ChevronDownOutline />
          </n-icon>
        </div>
        <div
          class="right-aside-window p-2.5"
          v-if="expandedItems[0] && expandedItems[0][index]"
        >
          <div
            v-for="child in item"
            :key="child.id"
            :data-id="child.id"
            :data-windowid="windowId"
            :data-url="child.url"
            class="group/aside right-aside-item mb-3"
          >
            <card
              :child="child"
              @delete="removeTab(child.id)"
              @click="activeTab(child)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sortable from "sortablejs"
import card from "./card.vue"
import { ChevronDownOutline } from "@vicons/ionicons5"
import { useExpand } from "@/hooks/useExpand.ts"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import tabbyDatabaseService from "@/db"
import { useSpacesStore } from "@/store/spaces.ts"

const { tabs, getTabs, removeTab, activeTab, moveTab } = useChromeTabs()
const { expandedItems, toggleExpand, generateExpandedItems } =
  useExpand("asideExpandedItems")
const spacesStore = useSpacesStore()

function refresh() {
  return spacesStore.getCollectionsById(spacesStore.activeSpaceId)
}

async function refreshTabs() {
  await getTabs()
}
chrome.tabs.onUpdated.addListener(refreshTabs)
chrome.tabs.onMoved.addListener(refreshTabs)
chrome.tabs.onRemoved.addListener(refreshTabs)
chrome.tabs.onAttached.addListener(refreshTabs)

onMounted(async () => {
  await getTabs()
  generateExpandedItems(0, Object.keys(tabs).length)
  Sortable.create(document.querySelector(".right-aside-area") as HTMLElement, {
    group: {
      name: "right-aside-parent",
      put: false,
    },
    animation: 150,
    handle: ".right-aside-item",
  })

  const dragChildAreas = document.querySelectorAll(".right-aside-window")
  dragChildAreas.forEach((dragChildArea) => {
    Sortable.create(dragChildArea as HTMLElement, {
      group: {
        name: "right-aside-child",
        pull: "clone",
      },
      animation: 150,
      handle: ".right-aside-item",
      ghostClass: "sortable-ghost-dashed-border",
      onMove: function (evt) {
        if (evt.to.classList.contains("drag-child-area")) {
          evt.dragged.classList.remove("mb-3")
          evt.dragged.classList.remove("right-aside-item")
          evt.dragged.classList.remove("group/aside")
          evt.dragged.classList.add("drag-item")
          evt.dragged.classList.add("group/content")
          evt.dragged.classList.add("peer")
        } else {
          evt.dragged.classList.remove("drag-item")
          evt.dragged.classList.remove("group/content")
          evt.dragged.classList.add("right-aside-item")
          evt.dragged.classList.add("group/aside")
          evt.dragged.classList.add("mb-3")
        }
      },
      onEnd: async function (/**Event*/ evt) {
        const { item: itemEl, to } = evt
        const { id, windowid } = itemEl.dataset
        if (to.classList.contains("drag-child-area")) {
          const toParent = to.parentElement
          const { collectionid: toClollectionId } = toParent!.dataset
          await tabbyDatabaseService.addCard({
            title: itemEl.innerText,
            url: itemEl.dataset.url!,
            collectionId: Number(toClollectionId!),
          })
          itemEl.remove()
          await refresh()
        } else {
          const element =
            itemEl.nextElementSibling || itemEl.previousElementSibling
          const { index } = (element as HTMLElement)?.dataset || { index: 0 }
          await moveTab(Number(id), Number(index), Number(windowid))
        }
      },
    })
  })
})
</script>
