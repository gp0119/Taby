<template>
  <div
    class="hidden items-center group-hover/item:flex"
    :class="{ '!flex': isShowTagAction }"
  >
    <PopoverIcon
      message="Open Collection"
      size="20"
      icon-class="text-primary mx-1.5"
      :icon="Launch"
      @click="onOpenCollection(item)"
    />
    <PopoverIcon
      size="20"
      icon-class="text-primary mx-1.5"
      message="Edit Collection"
      :icon="Edit"
      @click="onEditCollection(item)"
    />
    <PopoverIcon
      message="Move Collection"
      size="20"
      icon-class="text-primary mx-1.5"
      :icon="FolderMoveTo"
      @click="onMoveCollection(item)"
    />
    <TagAction :item="item" />
  </div>
</template>

<script setup lang="tsx">
import { CollectionWithCards } from "@/type.ts"
import { FolderMoveTo, Delete, Edit, Launch } from "@vicons/carbon"
import { useDialog } from "naive-ui"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useChromeTabs } from "@/hooks/useChromeTabs.ts"
import TagAction from "./tag-action.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useBatchMoveCollectionDialog } from "@/hooks/useBatchMoveCollectionDialog.tsx"
import PopoverIcon from "@/components/popover-icon.vue"

const { ft, gt } = useHelpi18n()
defineProps<{
  item: CollectionWithCards
}>()

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
              type="primary"
              onClick={() => onDeleteCollection(item)}
              v-slots={{
                icon: () => <n-icon size="16" component={Delete} />,
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

const dialog = useDialog()
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
      dialog.destroyAll()
    },
  })
}

const { openDialog: openMoveDialog } = useBatchMoveCollectionDialog()
async function onMoveCollection(item: CollectionWithCards) {
  const { spaceId, position } = await openMoveDialog(
    gt("move-type-to", item.title),
  )
  await dataManager.batchUpdateCollections(
    [item.id],
    { spaceId: spaceId! },
    position,
  )
  await refreshCollections()
  refreshCollections(spaceId as number)
}

function onOpenCollection(item: CollectionWithCards) {
  openTabs(item.cards.map((card) => card.url))
}
</script>
