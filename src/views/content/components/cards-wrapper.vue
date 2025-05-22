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
    @end="onDragEnd"
  >
    <Card
      v-for="card in cards"
      :key="card.id"
      :data-id="card.id"
      class="card-item group/content"
      :child="card"
      :select-ids="batchCardStore.selectedCardIds"
      :duplicate-url="duplicateCardStore.currentDuplicateUrl"
      :show-checkbox="
        batchCollectionStore.selectedCollectionIds.length <= 0 &&
        batchTabsStore.selectedTabIds.length <= 0
      "
      @click="onHandleClick(card)"
      @edit="onEdit(card)"
      @check="onHandleCheckbox($event, card)"
    />
    <div class="empty-text">
      {{ ft("no-cards") }}
    </div>
  </VueDraggable>
</template>

<script setup lang="tsx">
import dataManager from "@/db"
import Card from "@components/card.vue"
import { Card as iCard } from "@/type.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import { VueDraggable } from "vue-draggable-plus"
import { useBatchCardStore } from "@/store/batch-card"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import Favicon from "@/components/favicon.vue"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { debounce } from "lodash-es"
import { useSpacesStore } from "@/store/spaces"
import { InformationSquare, FolderMoveTo, Delete } from "@vicons/carbon"
import { useDialog } from "naive-ui"
import { useBatchMoveCardDialog } from "@/hooks/useBatchMoveCardDialog.tsx"

defineProps<{
  cards: iCard[]
  collectionId: number
}>()

const { refreshCollections } = useRefresh()
const batchCardStore = useBatchCardStore()
const { ft, gt } = useHelpi18n()
const duplicateCardStore = useDuplicateCardStore()
const batchCollectionStore = useBatchCollectionStore()
const batchTabsStore = useBatchTabsStore()
const spacesStore = useSpacesStore()
const dialog = useDialog()

const { open: openDeleteDialog } = useDeleteDialog()
const { open: openEditDialog } = useEditDialog()
async function onHandleClick(child: any) {
  const activeId = spacesStore.activeId
  const tab = await chrome.tabs.create({ url: child.url })
  if (child.favicon) return
  const tabId = tab.id!
  onHandleNoFavicon(tabId, child.id, activeId)
}

const debounceUpdateCardFavicon = debounce(
  async (cardId: number, favicon: string, activeId: number) => {
    await dataManager.updateCardFavicon(cardId, favicon)
    await refreshCollections(activeId)
  },
  1000,
  {
    leading: true,
    trailing: false,
  },
)

function onHandleNoFavicon(tabId: number, cardId: number, activeId: number) {
  chrome.tabs.onUpdated.addListener(
    async function listener(updatedTabId, changeInfo) {
      console.log("changeInfo: ", changeInfo)
      if (updatedTabId === tabId && changeInfo.favIconUrl) {
        const favicon = changeInfo.favIconUrl
        if (!favicon) return
        debounceUpdateCardFavicon(cardId, favicon, activeId)
        chrome.tabs.onUpdated.removeListener(listener)
      }
    },
  )
}

async function onDeleteCard(card: iCard) {
  openDeleteDialog({
    title: ft("delete", "card"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", card.title)}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeCard(card.id)
      await refreshCollections()
      dialog.destroyAll()
    },
  })
}

const { openDialog } = useBatchMoveCardDialog()
const onHandleMove = async (card: iCard) => {
  const { collectionId, position, spaceId } = await openDialog()
  await dataManager.batchUpdateCards(
    [card.id],
    { collectionId: collectionId! },
    position,
  )
  await refreshCollections()
  refreshCollections(spaceId as number)
  dialog.destroyAll()
}

function onEdit(child: iCard) {
  const formModel = ref({
    title: child.title,
    description: child.description,
    favicon: child.favicon,
  })
  openEditDialog({
    title: () => {
      return (
        <div class="flex items-center">
          <n-button
            focusable={false}
            size="small"
            class="w-[28px]"
            v-slots={{
              icon: () => <Favicon child={child} />,
            }}
          />
          <span class="ml-2">{ft("edit", "card")}</span>
        </div>
      )
    },
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`}>
          <n-input
            v-model:value={formModel.value.title}
            placeholder={ft("placeholder", "title")}
          />
        </n-form-item>
        <n-form-item label={`${ft("description")}:`}>
          <n-input
            v-model:value={formModel.value.description}
            placeholder={ft("placeholder", "description")}
          />
        </n-form-item>
        <n-form-item label={`${ft("url")}:`}>
          <n-input v-model:value={child.url} disabled />
        </n-form-item>
        <n-form-item
          v-slots={{
            label: () => (
              <div class="flex items-center">
                <n-popover
                  trigger="hover"
                  content-class="!p-0"
                  class="!rounded-md !bg-card-color !px-2 !py-1 text-text-primary"
                  arrow-class="!bg-card-color"
                  placement="top-start"
                  v-slots={{
                    trigger: () => (
                      <n-icon
                        size="16"
                        class="mr-1 cursor-pointer text-primary"
                        component={InformationSquare}
                      />
                    ),
                    default: () => (
                      <span class="text-xs">{ft("favicon-tip")}</span>
                    ),
                  }}
                />
                <span>{ft("favicon")}:</span>
              </div>
            ),
          }}
        >
          <n-input
            v-model:value={formModel.value.favicon}
            placeholder={ft("placeholder", "favicon")}
          />
        </n-form-item>
      </n-form>
    ),
    renderAction: ({ close }) => {
      return (
        <div class="flex w-full items-center gap-x-3">
          <n-button
            ghost
            type="primary"
            size="small"
            v-slots={{
              icon: () => <n-icon size="16" component={Delete} />,
            }}
            onClick={() => onDeleteCard(child)}
          />
          <n-button
            ghost
            type="primary"
            class="mr-auto"
            size="small"
            v-slots={{
              icon: () => <n-icon size="16" component={FolderMoveTo} />,
            }}
            onClick={() => onHandleMove(child)}
          >
            {ft("move")}
          </n-button>
          <n-button ghost size="small" onClick={() => close()}>
            {ft("cancel")}
          </n-button>
          <n-button
            type="primary"
            size="small"
            onClick={async () => {
              let faviconId
              if (formModel.value.favicon) {
                faviconId = await dataManager.addFavicon(
                  formModel.value.favicon,
                )
              }
              await dataManager.updateCard(child.id, {
                title: formModel.value.title,
                description: formModel.value.description,
                faviconId,
              })
              await refreshCollections()
              close()
            }}
          >
            {ft("confirm")}
          </n-button>
        </div>
      )
    },
  })
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
  await refreshCollections()
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
  @apply grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-5 px-4 pb-4 pt-2;
}
.empty-text {
  @apply col-span-full text-center text-lg leading-[90px] text-gray-300;
  @apply group-has-[.card-item]/wrapper:hidden group-has-[.right-aside-item]/wrapper:hidden;
}

.card-wrapper :deep(.close-button) {
  display: none !important;
}
</style>
