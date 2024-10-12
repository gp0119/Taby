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
        class="right-aside-window mb-3 rounded p-2.5 shadow-base"
      >
        <div class="flex items-center py-1.5">
          <span>Window {{ index + 1 }}</span>
          <n-icon
            size="20"
            class="ml-2 inline-block cursor-pointer text-red-600"
            @click="toggleExpand(index)"
          >
            <ChevronDownOutline />
          </n-icon>
        </div>
        <template v-if="expandedItems[index]">
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
        </template>
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
import { useDataStore } from "@/store/data.ts"

const { expandedItems, generateExpandedItems, toggleExpand } = useExpand()
const { tabs, getTabs, removeTab, activeTab, moveTab } = useChromeTabs()
const dataStore = useDataStore()

onMounted(async () => {
  await getTabs()
  generateExpandedItems(tabs.value.length)
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
      group: "right-aside-item",
      animation: 150,
      handle: ".right-aside-item",
      ghostClass: "sortable-ghost-dashed-border",
      onMove: function (evt) {
        if (evt.to.classList.contains("drag-child-area")) {
          evt.dragged.classList.remove("my-3")
          evt.dragged.classList.remove("right-aside-item")
          evt.dragged.classList.remove("group/aside")
          evt.dragged.classList.add("drag-item")
          evt.dragged.classList.add("group/content")
        } else {
          evt.dragged.classList.remove("drag-item")
          evt.dragged.classList.remove("group/content")
          evt.dragged.classList.add("right-aside-item")
          evt.dragged.classList.add("group/aside")
          evt.dragged.classList.add("my-3")
        }
      },
      onEnd: function (/**Event*/ evt) {
        const { item: itemEl, to } = evt
        const { id, windowid } = itemEl.dataset
        console.log("evt: ", evt)
        if (to.classList.contains("drag-child-area")) {
          removeTab(Number(id))
          const toParent = to.parentElement
          const { collectionid: toClollectionIndex } = toParent!.dataset
          dataStore.addCard(Number(toClollectionIndex), {
            title: itemEl.innerText,
            url: itemEl.dataset.url!,
            customTitle: "",
            customDescription: "",
          })
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
</script>
