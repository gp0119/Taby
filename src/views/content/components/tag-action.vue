<template>
  <n-popover
    trigger="hover"
    placement="bottom-end"
    :show-arrow="false"
    class="min-w-[150px]"
    :show="isShowTagAction"
    @update:show="setIsShowTagAction"
  >
    <template #trigger>
      <n-button quaternary size="small" class="w-[28px]">
        <template #icon>
          <n-icon size="18" :component="TagGroup" />
        </template>
      </n-button>
    </template>
    <template #header>
      <n-text depth="1">
        <span class="font-bold text-text-primary">{{ ft("tags") }}</span>
      </n-text>
    </template>
    <n-scrollbar class="max-h-[300px]">
      <n-space v-if="tagsStore.tags.length > 0" vertical>
        <div
          v-for="tag in tagsStore.tags"
          :key="tag.id"
          class="group/tag flex items-center justify-between"
        >
          <Tag
            :tag="tag"
            :closeable="false"
            @click="addTagforCollection(tag.id)"
          />
          <PopoverIcon
            :message="ft('edit', 'tag')"
            size="16"
            icon-class="ml-1 mr-4 hidden cursor-pointer text-primary group-hover/tag:block"
            :icon="TagEdit"
            @click="onEditTag(tag)"
          />
        </div>
      </n-space>
      <div v-else class="!bg-card-color text-center text-text-secondary">
        {{ ft("no-tags") }}
      </div>
    </n-scrollbar>
    <template #footer>
      <n-input-group>
        <color-select v-model:value="selectedColor" size="tiny" />
        <n-input
          v-model:value="newTag.title"
          class="!w-[100px]"
          :placeholder="ft('placeholder', 'tag')"
          size="tiny"
          maxlength="10"
        />
        <n-button size="tiny" @click="addTag">
          <template #icon>
            <n-icon :component="Checkmark" />
          </template>
        </n-button>
      </n-input-group>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { COLOR_LIST } from "@/utils/constants.ts"
import ColorSelect from "@components/color-select.vue"
import { TagGroup, TagEdit, Checkmark, Delete } from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards } from "@/type"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog"
import { useDeleteDialog } from "@/hooks/useDeleteDialog"
import Tag from "@/components/tag.vue"
import { useDialog } from "naive-ui"
import PopoverIcon from "@/components/popover-icon.vue"

const props = defineProps<{
  item: CollectionWithCards
}>()

const { refreshCollections } = useRefresh()
const { ft, gt } = useHelpi18n()
const tagsStore = useTagsStore()
const selectedColor = ref<string>(COLOR_LIST[0])
const newTag = ref({
  title: "",
})

const { isShowTagAction, setIsShowTagAction } = inject("isShowTagAction") as {
  isShowTagAction: boolean
  setIsShowTagAction: (value: boolean) => void
}

onMounted(async () => {
  await tagsStore.fetchTags()
})
const addTag = () => {
  if (newTag.value.title === "") return
  tagsStore.addTag({
    title: newTag.value.title,
    color: selectedColor.value,
  })
  newTag.value.title = ""
}
const addTagforCollection = async (id: number) => {
  await dataManager.addTagforCollection(props.item.id, id)
  await refreshCollections()
}

const { open: openEditDialog } = useEditDialog()
const { open: openDeleteDialog } = useDeleteDialog()
const dialog = useDialog()
const onDeleteTag = async (tag: {
  id: number
  title: string
  color: string
}) => {
  openDeleteDialog({
    title: ft("delete", "tag"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", tag.title)}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeLabel(tag.id)
      await tagsStore.fetchTags()
      await refreshCollections()
      dialog.destroyAll()
    },
  })
}
const onEditTag = (tag: { id: number; title: string; color: string }) => {
  const formModel = ref({ title: tag.title, color: tag.color })
  openEditDialog({
    title: ft("edit", "tag"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`} class="!mb-1">
          <n-input-group>
            <color-select v-model:value={formModel.value.color} />
            <n-input
              v-model:value={formModel.value.title}
              placeholder={ft("placeholder", "tag")}
            />
            <n-button
              secondary
              type="error"
              onClick={() => onDeleteTag(tag)}
              v-slots={{
                icon: () => <n-icon size="16" component={Delete} />,
              }}
            />
          </n-input-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      await dataManager.updateLabel(
        tag.id,
        formModel.value.title,
        formModel.value.color,
      )
      await tagsStore.fetchTags()
      await refreshCollections()
    },
  })
}
</script>
