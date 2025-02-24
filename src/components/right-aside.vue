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
        <div
          v-for="(item, windowId, index) in tabs"
          :key="index"
          class="mb-3 rounded shadow-base"
        >
          <div class="flex items-center p-2.5">
            <span class="select-none text-text-primary"
              >Window {{ index + 1 }}</span
            >
            <n-icon
              size="20"
              class="ml-2 inline-block cursor-pointer text-primary"
              @click="isExpanded = !isExpanded"
            >
              <ChevronDownOutline />
            </n-icon>
          </div>
          <div class="right-aside-window p-2.5" v-if="isExpanded">
            <div
              v-for="child in item"
              :key="child.id"
              :data-id="child.id"
              :data-windowid="windowId"
              :data-url="child.url"
              :data-title="child.title"
              class="group/aside right-aside-item mb-3"
            >
              <card
                type="right-aside"
                :child="child"
                @delete="removeTab(child.id)"
                @click="activeTab(child)"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es"
import Sortable from "sortablejs"
import card from "./card.vue"
import { ChevronDownOutline } from "@vicons/ionicons5"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import DataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"

const dataManager = new DataManager()
const { tabs, getTabs, removeTab, activeTab, moveTab } = useChromeTabs()
const isExpanded = ref(true)
const { refreshCollections } = useRefresh()

async function refreshTabs() {
  await getTabs()
  console.log("tabs: ", tabs)
}

const debounceRefreshTabs = debounce(refreshTabs, 100)

chrome.tabs.onUpdated.addListener(debounceRefreshTabs)
chrome.tabs.onMoved.addListener(debounceRefreshTabs)
chrome.tabs.onRemoved.addListener(debounceRefreshTabs)
chrome.tabs.onAttached.addListener(debounceRefreshTabs)

const debounceCreateDraggable = debounce(createDraggable, 100)
function createDraggable() {
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
          const element = itemEl.nextElementSibling
          chrome.tabs.sendMessage(
            Number(id),
            { action: "getFavicons" },
            async function (favicon) {
              const fromCardId = await addCard({
                title: itemEl.dataset.title!,
                url: itemEl.dataset.url!,
                collectionId: Number(toClollectionId),
                favicon,
              })
              itemEl.remove()
              if (element) {
                const toCardId = (element as HTMLElement)?.dataset.id
                await dataManager.moveCard(fromCardId, Number(toCardId))
              }
              await refreshCollections()
            },
          )
        } else {
          const element =
            itemEl.nextElementSibling || itemEl.previousElementSibling
          const { index } = (element as HTMLElement)?.dataset || { index: 0 }
          await moveTab(Number(id), Number(index), Number(windowid))
        }
      },
    })
  })
}

async function addCard({
  title,
  url,
  collectionId,
  favicon,
}: {
  title: string
  url: string
  collectionId: number
  favicon?: string
}) {
  const id = await dataManager.addCard({
    title,
    url,
    collectionId,
    ...(favicon && { favicon }),
  })
  return id
}

onMounted(async () => {
  await getTabs()
  debounceCreateDraggable()
})

const tabsLength = computed(() => {
  return Object.keys(tabs.value).reduce(
    (acc, cur) => acc + tabs.value[cur].length,
    0,
  )
})

watch(
  () => tabsLength.value,
  async (newLength, oldLenth) => {
    if (newLength <= oldLenth) return
    await nextTick()
    debounceCreateDraggable()
  },
)
</script>
