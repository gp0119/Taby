<template>
  <n-scrollbar class="max-h-[calc(100vh-50px)]">
    <div class="drag-parent-area bg-border-color">
      <div
        v-for="item in collections"
        :key="item.id"
        class="drag-item bg-body-color group/item mb-[1px] p-7"
      >
        <div class="flex items-center justify-between pb-4 text-lg">
          <div class="flex items-center">
            <span class="select-none text-text-primary">{{ item.title }}</span>
            <n-icon
              size="20"
              class="ml-2 inline-block cursor-pointer text-primary"
              :component="ChevronDownOutline"
              @click="expandStore.toggleExpand(item.id)"
            />
          </div>
          <n-space class="!hidden group-hover/item:!flex">
            <n-icon
              size="20"
              class="cursor-pointer text-primary"
              :component="Edit"
              @click="onEditCollection(item)"
            />
            <n-icon
              size="20"
              class="cursor-pointer text-primary"
              :component="FolderMoveTo"
              @click="onMoveCollection(item)"
            />
            <n-icon
              size="20"
              class="cursor-pointer text-primary"
              :component="Delete"
              @click="onDeleteCollection(item)"
            />
          </n-space>
        </div>
        <div
          :data-collectionid="item.id"
          v-show="expandStore.getExpandState(item.id)"
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
                type="content"
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
        v-if="!collections?.length"
        class="bg-body-color py-16 text-center text-2xl text-gray-400"
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
import { FolderMoveTo, Delete, Edit } from "@vicons/carbon"
import { useSpacesStore } from "@/store/spaces.ts"
import { useExpandStore } from "@/store/expand.ts"
import { faviconURL } from "@/utils"
import DataManager from "@/db"
import { Card as iCard, Collection } from "@/type.ts"

const spacesStore = useSpacesStore()
const expandStore = useExpandStore()
const dataManager = new DataManager()

const dialog = useDialog()

function refresh() {
  return spacesStore.fetchCollections(spacesStore.activeId)
}

const collections = computed(() => spacesStore.collections)
const allSpaces = computed(() => spacesStore.spaces)

onMounted(async () => {
  await refresh()
  createDraggable()
})

watch(
  () => collections.value.length,
  async () => {
    await refresh()
    createDraggable()
  },
)

function createDraggable() {
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
      collections.value?.forEach((item, index) => {
        if (index === oldIndex) collectionId = item.id
        if (index === newIndex) targetCollectionId = item.id
      })
      await dataManager.moveCollection(collectionId!, targetCollectionId!)
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
        collections.value?.forEach((item) => {
          if (item.id === Number(fromCollectionId)) {
            fromCardId = item.cards[oldIndex!]?.id
          }
          if (item.id === Number(toCollectionId)) {
            toCardId = item.cards[newIndex!]?.id
          }
        })
        if (fromCollectionId === toCollectionId) {
          await dataManager.moveCard(fromCardId!, toCardId!)
        } else {
          await dataManager.moveCardToCollection(
            fromCardId!,
            Number(toCollectionId)!,
          )
        }
        await refresh()
      },
    })
  })
}

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
    titleClass: "!text-text-primary",
    class: "bg-body-color",
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
      await dataManager.updateCardTitleAndDescription(child.id, {
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
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: async () => {
      await dataManager.removeCollection(item.id)
      await refresh()
    },
  })
}

function onMoveCollection(item: Collection) {
  const spaceId = ref<number | null>(null)
  dialog.create({
    title: `Move ${item.title} to`,
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form>
        <n-form-item label="Space">
          <n-select
            v-model:value={spaceId.value}
            options={allSpaces.value.map((item) => ({
              label: item.title,
              value: item.id,
            }))}
          ></n-select>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!spaceId.value) return
      await dataManager.moveCollectionToSpace(item.id, spaceId.value)
      await refresh()
    },
  })
}

function onEditCollection(item: Collection) {
  const formModel = ref({ title: item.title })
  dialog.create({
    title: "Edit Collection",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Title">
          <n-input v-model:value={formModel.value.title} />
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      await dataManager.updateCollectionTitle(item.id, formModel.value.title)
      await refresh()
    },
  })
}

async function onDeleteCard(card: iCard) {
  await dataManager.removeCard(card.id)
  await refresh()
}
</script>
