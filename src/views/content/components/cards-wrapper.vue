<template>
  <n-grid
    :x-gap="20"
    :y-gap="20"
    ref="cardsWrapperRef"
    cols="1 400:2 600:3 800:4 1000:5 1200:6 1400:7 1600:8 1800:9 2000:10 2200:11 2400:12"
    class="min-h-[50px] has-[.drag-item]:border-none"
    :class="{
      'rounded border border-dashed border-gray-300': !cards.length,
    }"
  >
    <n-gi
      v-for="card in cards"
      :key="card.id"
      :data-id="card.id"
      class="drag-item group/content peer"
    >
      <Card
        type="content"
        :child="card"
        @click="onHandleClick(card)"
        @delete="onDeleteCard(card)"
        @edit="onEdit(card)"
      />
    </n-gi>
  </n-grid>
</template>

<script setup lang="tsx">
import DataManager from "@/db"
import Card from "@components/card.vue"
import { Card as iCard } from "@/type.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import Sortable from "sortablejs"

defineProps<{
  cards: iCard[]
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()
const dialog = useDialog()
const cardsWrapperRef = useTemplateRef<any>("cardsWrapperRef")

async function onHandleClick(child: any) {
  const tab = await chrome.tabs.create({ url: child.url })
  if (child.favicon) return
  const tabId = tab.id!
  chrome.tabs.onUpdated.addListener(
    function listener(updatedTabId, changeInfo, _tab) {
      if (updatedTabId === tabId && changeInfo.status == "complete") {
        chrome.tabs.sendMessage(
          tabId,
          { action: "getFavicons" },
          async function (favicon) {
            console.log("favicon: ", favicon)
            await dataManager.updateCardFavicon(child.id, favicon)
            await refreshCollections()
          },
        )
        chrome.tabs.onUpdated.removeListener(listener)
      }
      return true
    },
  )
}

async function onDeleteCard(card: iCard) {
  dialog.create({
    title: () => {
      return <span class="ml-2.5">Delete Card</span>
    },
    titleClass: "!text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Delete",
    content: () => <div>Are you sure you want to delete this card?</div>,
    onPositiveClick: async () => {
      await dataManager.removeCard(card.id)
      await refreshCollections()
    },
  })
}

function onEdit(child: iCard) {
  const formModel = ref({
    title: child.customTitle || child.title,
    description: child.customDescription || child.title,
    favicon: child.favicon,
  })
  dialog.create({
    title: () => {
      return <span class="ml-2.5">Edit Card</span>
    },
    titleClass: "!text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    icon: () => (
      <favicon class="block h-full w-full" type="content" child={child} />
    ),
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Title: ">
          <n-input v-model:value={formModel.value.title} />
        </n-form-item>
        <n-form-item label="Description: ">
          <n-input v-model:value={formModel.value.description} />
        </n-form-item>
        <n-form-item label="URL: ">
          <n-input v-model:value={child.url} disabled />
        </n-form-item>
        <n-form-item label="Favicon: ">
          <n-input v-model:value={formModel.value.favicon} />
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      await dataManager.updateCard(child.id, {
        title: formModel.value.title,
        description: formModel.value.description,
        favicon: formModel.value.favicon,
      })
      await refreshCollections()
    },
  })
}

const createCardsDragable = () => {
  console.log("cardsWrapperRef: ", cardsWrapperRef.value)
  if (!cardsWrapperRef.value) return
  Sortable.create(cardsWrapperRef.value._.refs.contentEl, {
    group: {
      name: "nested-child",
      put: ["nested-child", "right-aside-child"],
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
    onEnd: async function (evt) {
      // const { from, to, oldIndex, newIndex } = evt
      // const { collectionid: fromCollectionId } = from.dataset
      // const { collectionid: toCollectionId } = to.dataset
      // let fromCardId: number, toCardId: number
      // collections.value?.forEach((item) => {
      //   if (item.id === Number(fromCollectionId)) {
      //     fromCardId = item.cards[oldIndex!]?.id
      //   }
      //   if (item.id === Number(toCollectionId)) {
      //     toCardId = item.cards[newIndex!]?.id
      //   }
      // })
      // if (fromCollectionId === toCollectionId) {
      //   await dataManager.moveCard(fromCardId!, toCardId!)
      // } else {
      //   await dataManager.moveCardToCollection(
      //     fromCardId!,
      //     Number(toCollectionId)!,
      //   )
      // }
      // await refreshCollections()
    },
  })
}

onMounted(() => {
  console.log("createCardsDragable")
  nextTick(() => {
    createCardsDragable()
  })
})
</script>
