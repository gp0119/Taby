<template>
  <n-scrollbar class="max-h-[calc(100vh-50px)]">
    <div class="drag-parent-area bg-gray-200">
      <div
        v-for="(item, index) in spacesStore.currentCollections"
        :key="item.id"
        class="drag-item mb-0.5 bg-[#fafafa] p-7"
      >
        <div class="group/title flex items-center justify-between pb-4 text-lg">
          <div class="flex items-center">
            <span class="select-none">{{ item.title }}</span>
            <n-icon
              size="20"
              class="ml-2 inline-block cursor-pointer text-red-600"
              :component="ChevronDownOutline"
              @click="onToggleExpand(index)"
            />
          </div>
          <n-space class="!hidden group-hover/title:!flex">
            <n-icon
              size="20"
              class="cursor-pointer text-red-450"
              :component="FolderMoveTo"
              @click="onMoveCollection(item)"
            />
            <n-icon
              size="20"
              class="cursor-pointer text-red-450"
              :component="Delete"
              @click="onDeleteCollection(item)"
            />
          </n-space>
        </div>
        <div
          :data-collectionid="item.id"
          v-if="expandedItems[spacesStore.activeSpaceId][index]"
        >
          <n-grid
            :x-gap="20"
            :y-gap="20"
            cols="1 400:2 600:3 800:4 1000:5 1200:6 1400:7 1600:8 1800:9 2000:10 2200:11 2400:12"
            class="drag-child-area min-h-[50px] has-[.drag-item]:border-none"
            :class="{
              'rounded border border-dashed border-gray-300':
                !item.cards.length,
            }"
            :data-collectionid="item.id"
          >
            <n-gi
              v-for="child in item.cards"
              :key="child.id"
              class="drag-item group/content peer"
            >
              <card
                :child="child"
                @click="onHandleClick(child)"
                @delete="onDeleteCard(child)"
                @edit="onEdit(child)"
              />
            </n-gi>
            <n-gi
              class="empty-text text-center leading-[50px] text-gray-300 peer-[.drag-item]:hidden"
              v-if="!item.cards.length"
              span="24"
            >
              This collection is empty. Drag tabs here
            </n-gi>
          </n-grid>
        </div>
      </div>
      <div
        v-if="!spacesStore.currentCollections?.length"
        class="bg-[#fafafa] py-16 text-center text-2xl text-gray-400"
      >
        No collections shared with this space yet.
      </div>
    </div>
  </n-scrollbar>
</template>

<script setup lang="tsx">
import card from "./card.vue"
import Sortable from "sortablejs"
import { ChevronDownOutline, DocumentTextOutline } from "@vicons/ionicons5"
import { FolderMoveTo, Delete } from "@vicons/carbon"
import { useExpand } from "@/hooks/useExpand.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { faviconURL } from "@/utils"
import tabbyDatabaseService from "@/db"
import { Card as iCard, Collection } from "@/type.ts"

const spacesStore = useSpacesStore()

const dialog = useDialog()

function refresh() {
  return spacesStore.getCollectionsById(spacesStore.activeSpaceId)
}

watch(
  () => spacesStore.activeSpaceId,
  async () => {
    await refresh()
    createDraggable()
  },
)

onMounted(async () => {
  await refresh()
  createDraggable()
})

function createDraggable() {
  console.log(
    'document.querySelector(".drag-parent-area"): ',
    document.querySelector(".drag-parent-area"),
  )
  Sortable.create(document.querySelector(".drag-parent-area") as HTMLElement, {
    group: {
      name: "nested-parent",
      put: ["nested-parent"],
    },
    animation: 150,
    ghostClass: "sortable-ghost-dashed-border",
    onEnd: async function (evt) {
      const { newIndex, oldIndex } = evt
      let collectionId: number, targetCollectionId: number
      spacesStore.currentCollections?.forEach((item, index) => {
        if (index === oldIndex) collectionId = item.id
        if (index === newIndex) targetCollectionId = item.id
      })
      await tabbyDatabaseService.moveCollection(
        collectionId!,
        targetCollectionId!,
      )
      await refresh()
    },
  })
  const dragChildAreas = document.querySelectorAll(".drag-child-area")
  dragChildAreas.forEach((dragChildArea) => {
    Sortable.create(dragChildArea as HTMLElement, {
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
        const { from, to, oldIndex, newIndex } = evt
        const { collectionid: fromCollectionId } = from.dataset
        const { collectionid: toCollectionId } = to.dataset
        let fromCardId: number, toCardId: number
        spacesStore.currentCollections?.forEach((item) => {
          if (item.id === Number(fromCollectionId)) {
            fromCardId = item.cards[oldIndex!]?.id
          }
          if (item.id === Number(toCollectionId)) {
            toCardId = item.cards[newIndex!]?.id
          }
        })
        if (fromCollectionId === toCollectionId) {
          await tabbyDatabaseService.moveCard(fromCardId!, toCardId!)
        } else {
          await tabbyDatabaseService.moveCardToCollection(
            fromCardId!,
            Number(toCollectionId)!,
          )
        }
        await refresh()
      },
    })
  })
}

const { expandedItems, generateExpandedItems, toggleExpand } = useExpand(
  "contentExpandedItems",
)

function onToggleExpand(index: number) {
  if (!spacesStore.currentCollections) return
  if (!expandedItems.value[spacesStore.activeSpaceId].length) {
    generateExpandedItems(
      spacesStore.activeSpaceId,
      spacesStore.currentCollections.length,
    )
  }
  toggleExpand(spacesStore.activeSpaceId, index)
}

watchEffect(() => {
  if (
    expandedItems.value[spacesStore.activeSpaceId]?.length ===
      spacesStore.currentCollections?.length ||
    !spacesStore.currentCollections
  )
    return
  generateExpandedItems(
    spacesStore.activeSpaceId,
    spacesStore.currentCollections.length,
  )
})

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
    onPositiveClick: async () => {
      await tabbyDatabaseService.updateCardTitleAndDescription(child.id, {
        title: formModel.value.title,
        description: formModel.value.description,
      })
      await refresh()
    },
  })
}

function onDeleteCollection(item: Collection) {
  dialog.error({
    title: "Delete Collection",
    content: "Are you sure you want to delete this collection?",
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: async () => {
      await tabbyDatabaseService.removeCollection(item.id)
      await refresh()
    },
  })
}

function onMoveCollection(item: Collection) {
  const spaceId = ref<number | null>(null)
  dialog.create({
    title: `Move ${item.title} to`,
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form>
        <n-form-item label="Space">
          <n-select
            v-model:value={spaceId.value}
            options={spacesStore.allSpaces.map((item) => ({
              label: item.title,
              value: item.id,
            }))}
          ></n-select>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!spaceId.value) return
      await tabbyDatabaseService.moveCollectionToSpace(item.id, spaceId.value)
      await refresh()
    },
  })
}

async function onDeleteCard(card: iCard) {
  await tabbyDatabaseService.removeCard(card.id)
  await refresh()
}
</script>
