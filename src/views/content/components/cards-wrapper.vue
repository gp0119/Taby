<template>
  <VueDraggable
    :model-value="cards"
    :group="{
      name: 'content-card',
      put: ['content-card', 'aside-card'],
    }"
    class="card-wrapper group/wrapper"
    item-key="id"
    :data-collectionid="collectionId"
    handle=".card-item"
    drag-class="*:!opacity-20"
    ghost-class="sortable-ghost-dashed-border"
    :animation="150"
    :delay="100"
    :delay-on-touch-only="true"
    :disabled="isMobileWeb"
    @end="onDragEnd"
  >
    <Card
      v-for="card in cards"
      :key="card.id"
      type="card"
      :data-id="card.id"
      class="card-item group/content"
      :child="card"
      :select-ids="batchCardStore.selectedCardIds"
      :duplicate-url="duplicateCardStore.currentDuplicateUrl"
      :show-checkbox="
        batchCollectionStore.selectedCollectionIds.length <= 0 &&
        batchTabsStore.selectedTabIds.length <= 0
      "
      @click="onHandleClick($event, card)"
      @edit="onEdit(card)"
      @check="onHandleCheckbox($event, card)"
    />
    <div class="empty-text select-none">
      {{ ft("no-cards") }}
    </div>
  </VueDraggable>
  <CardDetailDialog
    v-if="editingCard"
    v-model:show="showDetail"
    :card="editingCard"
  />
</template>

<script setup lang="tsx">
import dataManager from "@/db"
import Card from "@components/card.vue"
import { Card as iCard } from "@/type.ts"
import { VueDraggable } from "vue-draggable-plus"
import { useBatchCardStore } from "@/store/batch-card"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { debounce } from "lodash-es"
import CardDetailDialog from "./card-detail-dialog.vue"
import { useSettingStore } from "@/store/setting"
import { hasExtensionTabs, isWeb } from "@/utils/platform"
import { openWebUrl } from "@/utils/web"
import { useMediaQuery } from "@vueuse/core"

defineProps<{
  cards: iCard[]
  collectionId: number
}>()

const batchCardStore = useBatchCardStore()
const { ft } = useHelpi18n()
const duplicateCardStore = useDuplicateCardStore()
const batchCollectionStore = useBatchCollectionStore()
const batchTabsStore = useBatchTabsStore()
const settingStore = useSettingStore()
const mobileLayoutQuery = useMediaQuery("(max-width: 999px)")
const isMobileWeb = computed(() => isWeb && mobileLayoutQuery.value)
const editingCard = ref<iCard>()
const showDetail = ref(false)

async function onHandleClick(e: MouseEvent, child: any) {
  if (!hasExtensionTabs()) {
    openWebUrl(child.url)
    return
  }

  let tabId: number
  if (e.ctrlKey || e.metaKey) {
    const tab = await chrome.tabs.create({ url: child.url, active: false })
    tabId = tab.id!
  } else if (!settingStore.getSetting("openInNewWindow")) {
    const currentTab = (
      await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
    )?.[0]
    tabId = currentTab.id!
    chrome.tabs.update(tabId, { url: child.url })
  } else {
    let tab = await chrome.tabs.create({ url: child.url })
    tabId = tab.id!
  }
  if (child.favicon) return
  onHandleNoFavicon(tabId, child.id)
}

const debounceUpdateCardFavicon = debounce(
  async (cardId: number, favicon: string) => {
    await dataManager.updateCardFavicon(cardId, favicon)
  },
  1000,
  {
    leading: true,
    trailing: false,
  },
)

function onHandleNoFavicon(tabId: number, cardId: number) {
  if (!hasExtensionTabs()) return

  let timer: ReturnType<typeof setTimeout>
  function listener(
    updatedTabId: number,
    changeInfo: chrome.tabs.OnUpdatedInfo,
  ) {
    if (updatedTabId === tabId && changeInfo.favIconUrl) {
      const favicon = changeInfo.favIconUrl
      if (!favicon) return
      debounceUpdateCardFavicon(cardId, favicon)
      cleanup()
    }
  }
  function cleanup() {
    clearTimeout(timer)
    chrome.tabs.onUpdated.removeListener(listener)
  }
  chrome.tabs.onUpdated.addListener(listener)
  timer = setTimeout(cleanup, 3000)
}

function onEdit(card: iCard) {
  editingCard.value = card
  showDetail.value = true
}

const onDragEnd = async (evt: any) => {
  const { from, to, item, oldIndex, newIndex } = evt
  if (oldIndex === newIndex && from === to) return
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
}

function onHandleCheckbox(checked: boolean, card: iCard) {
  if (checked) {
    batchCardStore.addSelectedCardId(card.id)
  } else {
    batchCardStore.removeSelectedCardId(card.id)
  }
}
</script>

<style scoped>
.card-wrapper {
  @apply grid grid-cols-[repeat(auto-fill,minmax(184px,1fr))] gap-5 px-4 pb-4 pt-2;
}
.empty-text {
  @apply col-span-full text-center text-lg leading-[90px] text-gray-300;
  @apply group-has-[.card-item]/wrapper:hidden group-has-[.right-aside-item]/wrapper:hidden;
}

.card-wrapper :deep(.close-button) {
  display: none !important;
}
</style>
