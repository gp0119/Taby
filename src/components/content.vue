<template>
  <n-scrollbar class="max-h-[calc(100vh-50px)]">
    <div class="drag-parent-area bg-border-color">
      <div
        v-for="item in collections"
        :key="item.id"
        class="drag-item group/item mb-[1px] bg-body-color p-7"
        :class="{
          'no-drag': isHoverTag,
        }"
      >
        <div
          class="flex items-center justify-between pb-4 text-lg"
          v-show="
            !tagsStore.selectedTagId ||
            (tagsStore.selectedTagId &&
              item.labelIds.includes(tagsStore.selectedTagId))
          "
        >
          <div class="flex items-center">
            <span class="select-none text-text-primary">{{ item.title }}</span>
            <n-icon
              size="20"
              class="ml-2 inline-block cursor-pointer text-primary"
              :component="ChevronDownOutline"
              @click="expandStore.toggleExpand(item.id)"
            />
            <n-space v-if="item.labels.length" class="ml-2">
              <n-tag
                class="group/tag"
                v-for="tag in item.labels"
                :key="tag.id"
                size="small"
                :color="{
                  color: `${tag.color}33`,
                  textColor: tag.color,
                  borderColor: `${tag.color}4A`,
                }"
              >
                <div class="flex items-center">
                  {{ tag.title }}
                  <n-icon
                    @click.stop="onDeleteTagFromCollection(item.id, tag.id)"
                    size="12"
                    class="hidden cursor-pointer group-hover/tag:block"
                    :component="Close"
                  />
                </div>
              </n-tag>
            </n-space>
          </div>
          <collection-action :item="item" />
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
import { useTagsStore } from "@/store/tags.ts"
import card from "./card.vue"
import collectionAction from "./collection-action.vue"
import Sortable from "sortablejs"
import {
  ChevronDownOutline,
  DocumentTextOutline,
  Close,
} from "@vicons/ionicons5"
import { useSpacesStore } from "@/store/spaces.ts"
import { useExpandStore } from "@/store/expand.ts"
import { faviconURL } from "@/utils"
import DataManager from "@/db"
import { Card as iCard } from "@/type.ts"
import { useRefresh } from "@/hooks/useRresh"

const spacesStore = useSpacesStore()
const expandStore = useExpandStore()
const dataManager = new DataManager()
const isHoverTag = ref(false)
const tagsStore = useTagsStore()

provide("isHoverTag", {
  isHoverTag,
  setIsHoverTag: (value: boolean) => {
    isHoverTag.value = value
  },
})

const dialog = useDialog()
const { refreshCollections } = useRefresh()

const collections = computed(() => {
  if (!tagsStore.selectedTagId) return spacesStore.collections
  return spacesStore.collections.filter((item) =>
    item.labelIds.includes(tagsStore.selectedTagId),
  )
})

onMounted(async () => {
  await refreshCollections()
  createDraggable()
})

const onDeleteTagFromCollection = async (
  collectionId: number,
  tagId: number,
) => {
  await dataManager.removeTagforCollection(collectionId, tagId)
  await refreshCollections()
}

watch(
  () => collections.value.length,
  async () => {
    await refreshCollections()
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
    filter: ".no-drag",
    onEnd: async function (evt) {
      const { newIndex, oldIndex } = evt
      let collectionId: number, targetCollectionId: number
      collections.value?.forEach((item, index) => {
        if (index === oldIndex) collectionId = item.id
        if (index === newIndex) targetCollectionId = item.id
      })
      await dataManager.moveCollection(collectionId!, targetCollectionId!)
      await refreshCollections()
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
        await refreshCollections()
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
      await refreshCollections()
    },
  })
}

async function onDeleteCard(card: iCard) {
  await dataManager.removeCard(card.id)
  await refreshCollections()
}
</script>
