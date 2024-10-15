<template>
  <n-scrollbar class="max-h-[calc(100vh-50px)]">
    <div class="drag-parent-area bg-gray-200">
      <div
        v-for="(item, index) in spacesStore.getCollections"
        :key="item.title"
        class="drag-item mb-0.5 bg-[#fafafa] p-7"
      >
        <div class="group/title flex items-center justify-between pb-4 text-lg">
          <div class="flex items-center">
            <span>{{ item.title }}</span>
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
              @click="onMoveCollection(item, index)"
            />
            <n-icon
              size="20"
              class="cursor-pointer text-red-450"
              :component="Delete"
              @click="onDeleteCollection(item, index)"
            />
          </n-space>
        </div>
        <div
          v-show="expandedItems[spacesStore.activeSpaceIndex][index]"
          :data-collectionid="index"
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
            :data-collectionid="index"
          >
            <n-gi
              v-for="(child, childIndex) in item.cards"
              :key="child.title"
              class="drag-item group/content peer"
            >
              <card
                :child="child"
                @click="onHandleClick(child)"
                @delete="() => spacesStore.removeCard(index, childIndex)"
                @edit="onEdit(child, index, childIndex)"
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
import { iCard, iCollection } from "@/type.ts"

const spacesStore = useSpacesStore()
const dialog = useDialog()

onMounted(() => {
  Sortable.create(document.querySelector(".drag-parent-area") as HTMLElement, {
    group: {
      name: "nested-parent",
      put: ["nested-parent"],
    },
    animation: 150,
    ghostClass: "sortable-ghost-dashed-border",
    onEnd: function (evt) {
      console.log("evt: ", evt)
      const { newIndex, oldIndex } = evt
      spacesStore.moveCollection(oldIndex!, newIndex!)
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
        spacesStore.moveCard(
          Number(fromCollectionIndex!),
          oldIndex!,
          Number(toCollectionIndex!),
          newIndex!,
        )
      },
    })
  })
})

const { expandedItems, generateExpandedItems, toggleExpand } = useExpand(
  "contentExpandedItems",
)

function onToggleExpand(index: number) {
  if (!expandedItems.value[spacesStore.activeSpaceIndex].length) {
    generateExpandedItems(
      spacesStore.activeSpaceIndex,
      spacesStore.getCollections.length,
    )
  }
  toggleExpand(spacesStore.activeSpaceIndex, index)
}

watchEffect(() => {
  if (
    expandedItems.value[spacesStore.activeSpaceIndex]?.length ===
    spacesStore.getCollections?.length
  )
    return
  generateExpandedItems(
    spacesStore.activeSpaceIndex,
    spacesStore.getCollections.length,
  )
})

function onHandleClick(child: any) {
  chrome.tabs.create({ url: child.url })
}

function onEdit(child: iCard, collectionIndex: number, cardIndex: number) {
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
      spacesStore.updateCard(collectionIndex, cardIndex, {
        ...child,
        customTitle: formModel.value.title,
        customDescription: formModel.value.description,
      })
    },
  })
}

function onDeleteCollection(item: iCollection, index: number) {
  dialog.error({
    title: "Delete Collection",
    content: "Are you sure you want to delete this collection?",
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: () => {
      spacesStore.removeCollection(index)
    },
  })
}

function onMoveCollection(item: iCollection, fromIndex: number) {
  const formModel = ref({
    toIndex: "",
  })
  dialog.create({
    title: `Move ${item.title} to`,
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Space">
          <n-select
            v-model:value={formModel.value.toIndex}
            options={spacesStore.mySpaces.map((item, toIndex) => ({
              label: item.title,
              value: toIndex,
            }))}
          ></n-select>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: () => {
      if (!formModel.value.toIndex) return
      spacesStore.moveCollectionToSpace(fromIndex, formModel.value.toIndex)
    },
  })
}
</script>
