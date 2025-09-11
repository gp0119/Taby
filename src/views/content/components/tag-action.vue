<template>
  <n-popover
    trigger="click"
    placement="bottom-end"
    :show-arrow="false"
    class="min-w-[150px]"
    content-style="padding: 0;"
    :show="isShowTagAction"
    @update:show="onUpdateShowTagAction"
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
    <template #default>
      <div class="scrollbar-thin max-h-[400px] overflow-y-auto">
        <div v-if="tagsStore.tags.length > 0" class="flex flex-col">
          <div
            v-for="tag in tagsStore.tags"
            :key="tag.id"
            class="group/tag flex cursor-pointer items-center justify-between px-2.5 py-1.5 hover:bg-hover-color"
            @click="addTagforCollection(tag.id)"
          >
            <Tag :tag="tag" :closeable="false" />
            <PopoverWrapper :message="ft('edit', 'tag')">
              <n-icon
                size="16"
                :component="TagEdit"
                class="ml-1 hidden cursor-pointer text-primary group-hover/tag:inline-flex"
                @click.stop="onEditTag(tag)"
              />
            </PopoverWrapper>
          </div>
        </div>
        <div v-else class="!bg-card-color text-center text-text-secondary">
          {{ ft("no-tags") }}
        </div>
      </div>
    </template>
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
        <n-button size="tiny" @click="saveAndAddTag">
          <template #icon>
            <n-icon :component="SaveAnnotation" />
          </template>
        </n-button>
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
import {
  TagGroup,
  TagEdit,
  Checkmark,
  Delete,
  SaveAnnotation,
} from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards } from "@/type"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog"
import { useDeleteDialog } from "@/hooks/useDeleteDialog"
import Tag from "@/components/tag.vue"
import { useDialog } from "naive-ui"
import PopoverWrapper from "@/components/popover-wrapper.vue"

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

const onUpdateShowTagAction = (value: boolean) => {
  selectedColor.value =
    COLOR_LIST[Math.floor(Math.random() * COLOR_LIST.length)]
  setIsShowTagAction(value)
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

const saveAndAddTag = async () => {
  if (newTag.value.title === "") return
  const tagId = await tagsStore.addTag({
    title: newTag.value.title,
    color: selectedColor.value,
  })
  newTag.value.title = ""
  await addTagforCollection(tagId)
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
              ghost
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
