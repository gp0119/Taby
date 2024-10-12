<template>
  <n-scrollbar class="max-h-[calc(100vh-50px)] bg-gray-200">
    <div class="drag-parent-area">
      <div
        v-for="(item, index) in dataStore.data"
        :key="item.title"
        class="drag-item mb-1.5 bg-[#fafafa] p-7"
      >
        <div class="flex items-center pb-4 text-lg">
          <span>{{ item.title }}</span>
          <n-icon
            size="20"
            class="ml-2 inline-block cursor-pointer text-red-600"
            @click="toggleExpand(index)"
            :component="ChevronDownOutline"
          />
        </div>
        <div v-show="expandedItems[index]" :data-collectionid="index">
          <n-grid
            :x-gap="20"
            :y-gap="20"
            cols="1 400:2 600:3 800:4 1000:5 1200:6 1400:7 1600:8 1800:9 2000:10 2200:11 2400:12"
            class="drag-child-area"
            :data-collectionid="index"
          >
            <n-gi
              v-for="(child, childIndex) in item.cards"
              :key="child.title"
              class="drag-item group/content"
            >
              <card
                :child="child"
                @click="onHandleClick(child)"
                @delete="() => dataStore.removeCard(index, childIndex)"
                @edit="onEdit(child)"
              />
            </n-gi>
          </n-grid>
        </div>
      </div>
    </div>
  </n-scrollbar>
</template>

<script setup lang="tsx">
import card from "./card.vue"
import Sortable from "sortablejs"
import { ChevronDownOutline, DocumentTextOutline } from "@vicons/ionicons5"
import { useExpand } from "@/hooks/useExpand.ts"
import { useDataStore } from "@/store/data.ts"
import { faviconURL } from "@/utils"
import { iCard } from "@/type.ts"

const dataStore = useDataStore()
const dialog = useDialog()
console.log("dataStore: ", dataStore)
onMounted(() => {
  Sortable.create(document.querySelector(".drag-parent-area") as HTMLElement, {
    group: {
      name: "nested-parent",
      put: ["nested-parent"],
    },
    animation: 150,
    ghostClass: "sortable-ghost-dashed-border",
    onEnd: function (evt) {
      const { newIndex, oldIndex } = evt
      dataStore.moveCollection(oldIndex!, newIndex!)
    },
  })

  const dragChildAreas = document.querySelectorAll(".drag-child-area")
  dragChildAreas.forEach((dragChildArea) => {
    Sortable.create(dragChildArea as HTMLElement, {
      group: {
        name: "nested-child",
        put: ["nested-child", "right-aside-item"],
      },
      animation: 150,
      handle: ".drag-item",
      ghostClass: "sortable-ghost-dashed-border",
      onMove: function (evt) {
        // evt.to 是目标容器
        if (evt.to.classList.contains("right-aside-window")) {
          return false // 阻止移动到这个区域
        }
      },
      onEnd: function (evt) {
        const { from, to, oldIndex, newIndex } = evt
        const { collectionid: fromCollectionIndex } = from.dataset
        const { collectionid: toCollectionIndex } = to.dataset
        dataStore.moveCard(
          Number(fromCollectionIndex!),
          oldIndex!,
          Number(toCollectionIndex!),
          newIndex!,
        )
      },
    })
  })
  generateExpandedItems(dataStore.data.length)
})

const { expandedItems, generateExpandedItems, toggleExpand } = useExpand()

function onHandleClick(child: any) {
  chrome.tabs.create({ url: child.url })
}

function onEdit(child: iCard) {
  const formModel = ref({
    title: child.customTitle || child.title,
    description: child.customDescription || child.title,
  })
  dialog.create({
    title: "",
    negativeText: "Cancel",
    positiveText: "Save",
    icon: () => (
      <n-avatar
        src={faviconURL(child.url)}
        size={24}
        v-slots={{
          fallback: () => (
            <n-icon
              class="bg-white"
              color="#999"
              size="24"
              component={DocumentTextOutline}
            />
          ),
        }}
      ></n-avatar>
    ),
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Title">
          <n-input v-model:value={formModel.value.title} />
        </n-form-item>
        <n-form-item label="Description">
          <n-input v-model:value={formModel.value.description} />
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: () => {
      console.log(111)
    },
  })
}
</script>
