<template>
  <div>
    <div
      class="h-[50px] border-0 border-b border-solid px-3 text-right leading-[50px]"
    >
      OPEN TABS
    </div>
    <div class="right-aside-area px-3 py-4">
      <div
        v-for="(item, index) in tabs"
        :key="index"
        class="mb-3 rounded p-2.5 shadow-base"
      >
        <div class="flex items-center py-1.5">
          <span>Window {{ index + 1 }}</span>
          <n-icon
            size="20"
            class="ml-2 inline-block cursor-pointer text-red-600"
            @click="toggleExpand(0, index)"
          >
            <ChevronDownOutline />
          </n-icon>
        </div>
        <div class="right-aside-window" v-if="expandedItems[0][index]">
          <div
            v-for="child in item"
            :key="child.id"
            :data-id="child.id"
            :data-windowid="child.windowId"
            :data-index="child.oldIndex"
            :data-url="child.url"
            class="group/aside right-aside-item my-3"
          >
            <card
              :child="child"
              @delete="removeTab(child.id)"
              @click="activeTab(child.id)"
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
// import { useSpacesStore } from "@/store/spaces.ts"

const { expandedItems, toggleExpand, generateExpandedItems } =
  useExpand("asideExpandedItems")
const { tabs, getTabs, removeTab, activeTab, moveTab } = useChromeTabs()
// const spacesStore = useSpacesStore()

onMounted(async () => {
  await getTabs()
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
      },
      animation: 150,
      handle: ".right-aside-item",
      ghostClass: "sortable-ghost-dashed-border",
      onMove: function (evt) {
        console.log("move aside card: ", evt)
        if (evt.to.classList.contains("drag-child-area")) {
          evt.dragged.classList.remove("my-3")
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
          evt.dragged.classList.add("my-3")
        }
      },
      onEnd: function (/**Event*/ evt) {
        console.log("evt: ", evt)
        const { item: itemEl, to } = evt
        const { id, windowid } = itemEl.dataset
        if (to.classList.contains("drag-child-area")) {
          removeTab(Number(id))
          // const toParent = to.parentElement
          // const { collectionid: toClollectionIndex } = toParent!.dataset
          // spacesStore.addCard(Number(toClollectionIndex), {
          //   title: itemEl.innerText,
          //   url: itemEl.dataset.url!,
          //   customTitle: "",
          //   customDescription: "",
          // })
        } else {
          const element =
            itemEl.nextElementSibling || itemEl.previousElementSibling
          const { index } = (element as HTMLElement)?.dataset || { index: 0 }
          moveTab(Number(id), Number(index), Number(windowid))
        }
      },
    })
  })
})

chrome.tabs.onUpdated.addListener(async () => {
  console.log(22)
  await getTabs()
  generateExpandedItems(0, tabs.value.length)
  console.log(document.querySelector(".right-aside-area"))
})
</script>
