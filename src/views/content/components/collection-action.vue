<template>
  <div
    class="hidden items-center group-hover/item:flex"
    :class="{ '!flex': isShowTagAction }"
  >
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Open Collection"
      :component="Launch"
      @click.stop="onOpenCollection(item)"
    />
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Edit Collection"
      :component="Edit"
      @click.stop="onEditCollection(item)"
    />
    <n-icon
      size="20"
      class="mx-1.5 cursor-pointer text-primary"
      title="Move Collection"
      :component="FolderMoveTo"
      @click.stop="onMoveCollection(item)"
    />
    <TagAction :item="item" />
  </div>
</template>

<script setup lang="tsx">
import { CollectionWithCards } from "@/type.ts"
import { FolderMoveTo, Delete, Edit, Launch } from "@vicons/carbon"
import { useDialog } from "naive-ui"
import DataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import TagAction from "./tag-action.vue"
const dialog = useDialog()

defineProps<{
  item: CollectionWithCards
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()
const { openTabs } = useChromeTabs()
const isShowTagAction = ref(false)

provide("isShowTagAction", {
  isShowTagAction,
  setIsShowTagAction: (value: boolean) => {
    isShowTagAction.value = value
  },
})

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
        <n-form-item label="Title" class="!text-text-primary">
          <n-input-group>
            <n-input v-model:value={formModel.value.title} />
            <n-button
              secondary
              type="error"
              onClick={() => onDeleteCollection(item)}
              v-slots={{
                icon: () => (
                  <n-icon>
                    <Delete />
                  </n-icon>
                ),
              }}
            ></n-button>
          </n-input-group>
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
      dialog.destroyAll()
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
          <space-select v-model={spaceId.value} />
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
