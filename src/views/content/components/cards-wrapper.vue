<template>
  <VueDraggable
    :model-value="cards"
    :group="{
      name: 'content-card',
      put: ['content-card', 'aside-card'],
    }"
    class="card-wrapper"
    item-key="id"
    :data-collectionid="collectionId"
    handle=".card-item"
    ghost-class="sortable-ghost-dashed-border"
    @end="onDragEnd"
  >
    <template v-if="cards.length">
      <Card
        v-for="card in cards"
        :key="card.id"
        :data-id="card.id"
        class="card-item group/content peer"
        type="content"
        :child="card"
        :select-ids="batchSelectStore.selectedCardIds"
        @click="onHandleClick(card)"
        @delete="onDeleteCard(card)"
        @edit="onEdit(card)"
        @check="onHandleCheckbox($event, card)"
      />
    </template>
    <template v-else>
      <div
        class="empty-text col-span-full text-center leading-[90px] text-gray-300 peer-[.card-item]:hidden"
      >
        This collection is empty. Drag tabs here
      </div>
    </template>
  </VueDraggable>
</template>

<script setup lang="tsx">
import DataManager from "@/db"
import Card from "@components/card.vue"
import { Card as iCard } from "@/type.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { VueDraggable } from "vue-draggable-plus"
import { useBatchSelectStore } from "@/store/batch-select"

defineProps<{
  cards: iCard[]
  collectionId: number
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()
const batchSelectStore = useBatchSelectStore()

const dialog = useDialog()

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

const onDragEnd = async (evt: any) => {
  const { from, to, item, oldIndex, newIndex } = evt
  const { collectionid: fromCollectionId } = from.dataset
  const { collectionid: toCollectionId } = to.dataset
  const fromCardId = item.getAttribute("data-id")
  if (fromCollectionId === toCollectionId) {
    await dataManager.moveCard(Number(fromCardId), oldIndex!, newIndex!)
  } else {
    await dataManager.moveCardToCollection(
      Number(fromCardId),
      Number(toCollectionId)!,
      newIndex,
    )
    item.remove()
  }
  await refreshCollections()
}

function onHandleCheckbox(checked: boolean, card: iCard) {
  console.log("checked: ", checked)
  if (checked) {
    batchSelectStore.addSelectedCardId(card.id)
  } else {
    batchSelectStore.removeSelectedCardId(card.id)
  }
}
</script>

<style scoped>
.card-wrapper {
  @apply grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-5 pt-2;
}

.card-wrapper :deep(.card-size) {
  height: 24px;
  width: 24px;
}

.card-wrapper :deep(.delete-button) {
  top: -8px;
}

.card-wrapper :deep(.copy-button) {
  bottom: -10px;
}

.card-wrapper :deep(.edit-button) {
  bottom: -10px;
}
</style>
