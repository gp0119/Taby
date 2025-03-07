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
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
const { ft, gt } = useHelpi18n()

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

const { open: openEditDialog } = useEditDialog()
const { open: openDeleteDialog } = useDeleteDialog()

function onEditCollection(item: CollectionWithCards) {
  const formModel = ref({ title: item.title })
  openEditDialog({
    title: ft("edit", "collection"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`} class="!text-text-primary">
          <n-input-group>
            <n-input
              v-model:value={formModel.value.title}
              placeholder={ft("placeholder", "title")}
            />
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
  openDeleteDialog({
    title: ft("delete", "collection"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", item.title)}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeCollection(item.id)
      await refreshCollections()
    },
  })
}

function onMoveCollection(item: CollectionWithCards) {
  const spaceId = ref<number | null>(null)
  openEditDialog({
    title: gt("move-to", item.title),
    renderContent: () => (
      <n-form>
        <n-form-item label={`${ft("space")}:`}>
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
