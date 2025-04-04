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
      <n-icon
        size="20"
        title="Tag"
        :component="TagGroup"
        @click.stop="() => {}"
        class="mx-1.5 cursor-pointer text-primary"
      />
    </template>
    <template #header>
      <n-text depth="1">
        <span class="font-bold text-text-primary">{{ ft("tags") }}</span>
      </n-text>
    </template>
    <n-scrollbar class="max-h-[300px]">
      <n-space vertical v-if="tagsStore.tags.length > 0">
        <div
          class="group/tag flex items-center justify-between"
          v-for="tag in tagsStore.tags"
          :key="tag.id"
        >
          <Tag
            :tag="tag"
            :closeable="false"
            @click="addTagforCollection(tag.id)"
          />
          <n-icon
            size="16"
            class="ml-1 mr-4 hidden cursor-pointer text-primary group-hover/tag:block"
            title="Edit Collection"
            :component="Edit"
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
        <color-select size="tiny" v-model:value="selectedColor" />
        <n-input
          class="!w-[100px]"
          v-model:value="newTag.title"
          :placeholder="ft('placeholder', 'tags')"
          size="tiny"
          maxlength="10"
        />
        <n-button size="tiny" @click="addTag">
          <template #icon>
            <n-icon :component="Checkmark"></n-icon>
          </template>
        </n-button>
      </n-input-group>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { COLOR_LIST } from "@/utils/constants.ts"
import ColorSelect from "@components/color-select.vue"
import { TagGroup, Edit, Checkmark, Delete } from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards } from "@/type"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog"
import { useDeleteDialog } from "@/hooks/useDeleteDialog"
import Tag from "@/components/tag.vue"
import { useDialog } from "naive-ui"

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
    title: ft("delete", "tags"),
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
    title: ft("edit", "tags"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`} class="!mb-1">
          <color-select v-model:value={formModel.value.color} />
          <n-input-group>
            <n-input
              v-model:value={formModel.value.title}
              placeholder={ft("placeholder", "tags")}
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

<style scoped></style>
