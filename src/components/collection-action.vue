<template>
  <div class="!hidden items-center group-hover/item:!flex">
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Open Collection"
      :component="Launch"
      @click="onOpenCollection(item)"
    />
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Edit Collection"
      :component="Edit"
      @click="onEditCollection(item)"
    />
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Move Collection"
      :component="FolderMoveTo"
      @click="onMoveCollection(item)"
    />
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Delete Collection"
      :component="Delete"
      @click="onDeleteCollection(item)"
    />
  </div>
</template>

<script setup lang="tsx">
import { CollectionWithCards } from "@/type"
import { FolderMoveTo, Delete, Edit, Launch } from "@vicons/carbon"
import { useDialog } from "naive-ui"
import DataManager from "@/db"
import { useSpacesStore } from "@/store/spaces"
import { useRefresh } from "@/hooks/useRresh"
import { useChromeTabs } from "@/hooks/useChromeTabs"
const dialog = useDialog()
defineProps<{
  item: CollectionWithCards
}>()

const dataManager = new DataManager()
const spacesStore = useSpacesStore()
const allSpaces = computed(() => spacesStore.spaces)
const { refreshCollections } = useRefresh()
const { openTabs } = useChromeTabs()
function onEditCollection(item: CollectionWithCards) {
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
      await refreshCollections()
    },
  })
}

function onDeleteCollection(item: CollectionWithCards) {
  dialog.error({
    title: "Delete Collection",
    content: "Are you sure you want to delete this collection?",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: async () => {
      await dataManager.removeCollection(item.id)
      await refreshCollections()
    },
  })
}

function onMoveCollection(item: CollectionWithCards) {
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
      await refreshCollections()
    },
  })
}

function onOpenCollection(item: CollectionWithCards) {
  openTabs(item.cards.map((card) => card.url))
}
</script>
