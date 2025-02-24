<template>
  <n-popover
    trigger="hover"
    :to="false"
    placement="bottom-end"
    :show-arrow="false"
    class="min-w-[150px]"
  >
    <template #trigger>
      <n-icon
        size="20"
        title="Tag"
        :component="TagGroup"
        class="mx-1.5 cursor-pointer text-primary"
      />
    </template>
    <template #header>
      <n-text depth="1">
        <span class="text-text-primary">Tags</span>
      </n-text>
    </template>
    <n-scrollbar
      class="max-h-[300px]"
      @mouseenter="setIsHoverTag(true)"
      @mouseleave="setIsHoverTag(false)"
    >
      <n-space vertical v-if="tagsStore.tags.length > 0">
        <div
          class="group/tag flex items-center justify-between"
          v-for="tag in tagsStore.tags"
          :key="tag.id"
        >
          <n-tag
            size="small"
            :color="{
              color: `${tag.color}33`,
              textColor: tag.color,
              borderColor: `${tag.color}4A`,
            }"
            @click="addTagforCollection(tag.id)"
            >{{ tag.title }}</n-tag
          >
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
        No tags
      </div>
    </n-scrollbar>
    <template #footer>
      <div>
        <n-input
          class="w-full"
          v-model:value="newTag.title"
          placeholder="Add tag"
          size="tiny"
          maxlength="10"
        />
      </div>
      <div class="mt-2 flex items-center gap-1">
        <color-select v-model:value="selectedColor" />
        <n-button size="tiny" @click="addTag">
          <template #icon>
            <n-icon :component="Checkmark"></n-icon>
          </template>
        </n-button>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { COLOR_LIST } from "@/utils/constants.ts"
import ColorSelect from "@components/color-select.vue"
import { TagGroup, Edit, Checkmark, Delete } from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards } from "@/type"
import DataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"
const props = defineProps<{
  item: CollectionWithCards
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()

const tagsStore = useTagsStore()
const selectedColor = ref(COLOR_LIST[0])
const newTag = ref({
  title: "",
})

const { setIsHoverTag } = inject("isHoverTag") as {
  isHoverTag: boolean
  setIsHoverTag: (value: boolean) => void
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

const dialog = useDialog()
const onDeleteTag = async (id: number) => {
  dialog.error({
    title: "Delete Tag",
    content: "Are you sure you want to delete this tag?",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "!bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: async () => {
      await dataManager.removeLabel(id)
      await tagsStore.fetchTags()
      await refreshCollections()
      dialog.destroyAll()
    },
  })
}
const onEditTag = (tag: { id: number; title: string; color: string }) => {
  const formModel = ref({ title: tag.title, color: tag.color })
  dialog.create({
    title: "Edit Tag",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <div>
        <n-form model={formModel.value}>
          <n-form-item label="Title" class="!mb-1">
            <n-input v-model:value={formModel.value.title} size="small" />
          </n-form-item>
        </n-form>
        <div class="flex items-center gap-1">
          <color-select v-model:value={formModel.value.color} class="flex-1" />
          <n-button
            size="tiny"
            secondary
            class="flex-1"
            type="error"
            onClick={() => onDeleteTag(tag.id)}
            v-slots={{
              icon: () => (
                <n-icon>
                  <Delete />
                </n-icon>
              ),
            }}
          >
            <span>DELETE</span>
          </n-button>
        </div>
      </div>
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
